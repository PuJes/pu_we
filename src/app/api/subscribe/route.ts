import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
import { upsertFrontendUser } from '@/lib/domain/users'
import { getPayloadClient } from '@/lib/payload'

const subscribeSchema = z.object({
  email: z.string().email().optional(),
  subscribed: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const body = await request.json()
    const payloadBody = parseWithSchema(subscribeSchema, body)
    const session = await getSessionFromRequest(request)

    if (!session && !payloadBody.email) {
      throw new ApiRouteError('UNAUTHORIZED', 'Email is required when not logged in.', 401)
    }

    let userId = session?.userId

    if (!userId && payloadBody.email) {
      const user = await upsertFrontendUser(payload, payloadBody.email)
      userId = String(user.id)
    }

    const updated = await payload.update({
      collection: 'users',
      id: userId as string,
      data: {
        isSubscribed: payloadBody.subscribed,
      },
      overrideAccess: true,
    })

    return Response.json({
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
        isSubscribed: updated.isSubscribed,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
