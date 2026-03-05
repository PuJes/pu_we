import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest, setSessionCookie, signSession } from '@/lib/auth/session'
import { validateOtpChallenge } from '@/lib/domain/otp-challenges'
import { upsertFrontendUser } from '@/lib/domain/users'
import { getPayloadClient } from '@/lib/payload'

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export async function POST(request: NextRequest) {
  try {
    const existing = await getSessionFromRequest(request)
    if (existing) {
      return Response.json({
        ok: true,
        data: {
          userId: existing.userId,
          email: existing.email,
          role: existing.role,
        },
      })
    }

    const body = await request.json()
    const payloadBody = parseWithSchema(verifyOtpSchema, body)

    const payload = await getPayloadClient()
    await validateOtpChallenge({
      payload,
      email: payloadBody.email,
      code: payloadBody.code,
    })

    const user = await upsertFrontendUser(payload, payloadBody.email)
    const token = await signSession({
      userId: String(user.id),
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
    })

    const response = NextResponse.json({
      ok: true,
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    })

    setSessionCookie(response, token)
    return response
  } catch (error) {
    return handleRouteError(error)
  }
}
