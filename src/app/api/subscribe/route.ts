import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseRequestBodyAsObject } from '@/lib/api/body'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
import { recordInteractionEvent } from '@/lib/domain/interaction-events'
import { upsertFrontendUser } from '@/lib/domain/users'
import { getPayloadClient } from '@/lib/payload'

const subscribeSchema = z.object({
  email: z.string().email().optional(),
  subscribed: z
    .union([z.boolean(), z.string()])
    .transform((value) => {
      if (typeof value === 'boolean') {
        return value
      }

      if (value === 'false' || value === '0') {
        return false
      }

      return true
    })
    .default(true),
})

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient()
    const body = await parseRequestBodyAsObject(request)
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

    if (!userId) {
      throw new ApiRouteError('UNAUTHORIZED', 'Unable to resolve user identity.', 401)
    }

    const updateArgs = {
      collection: 'users',
      id: userId,
      data: {
        isSubscribed: Boolean(payloadBody.subscribed),
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.update>[0]

    const updated = (await payload.update(updateArgs)) as {
      id: string | number
      email: string
      isSubscribed?: boolean
    }

    await recordInteractionEvent({
      payload,
      event: 'subscribe_updated',
      request,
      userId: session?.userId || userId,
      targetType: 'subscribe',
      targetId: String(updated.id),
      meta: {
        subscribed: Boolean(updated.isSubscribed),
      },
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
