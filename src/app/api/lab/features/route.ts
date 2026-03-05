import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getPayloadClient } from '@/lib/payload'

const createFeatureSchema = z.object({
  ideaId: z.string().min(1),
  content: z.string().min(3).max(1200),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      throw new ApiRouteError('UNAUTHORIZED', 'Please verify OTP before submitting a feature.', 401)
    }

    const body = await request.json()
    const payloadBody = parseWithSchema(createFeatureSchema, body)

    const payload = await getPayloadClient()
    const ideaId = Number(payloadBody.ideaId)
    const authorId = Number(session.userId)

    const createArgs = {
      collection: 'features',
      data: {
        idea: Number.isNaN(ideaId) ? undefined : ideaId,
        author: Number.isNaN(authorId) ? undefined : authorId,
        content: payloadBody.content,
        voteCount: 0,
        status: 'open',
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]

    const created = await payload.create(createArgs)

    return Response.json({ ok: true, data: created }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
