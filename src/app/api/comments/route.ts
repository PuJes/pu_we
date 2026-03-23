import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
import { recordInteractionEvent } from '@/lib/domain/interaction-events'
import { getPayloadClient } from '@/lib/payload'

const createCommentSchema = z.object({
  targetType: z.enum(['content', 'idea', 'feature']),
  targetId: z.string().min(1),
  content: z.string().min(1).max(2000),
  guestName: z.string().max(64).optional(),
  guestEmail: z.string().email().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payloadBody = parseWithSchema(createCommentSchema, body)
    const guestName = payloadBody.guestName?.trim()
    const guestEmail = payloadBody.guestEmail?.trim().toLowerCase()

    const session = await getSessionFromRequest(request)
    if (!session && !guestName) {
      throw new ApiRouteError('INVALID_INPUT', '未登录评论请先填写昵称。', 400)
    }

    const payload = await getPayloadClient()
    const authorId = session?.userId ? Number(session.userId) : undefined

    const createArgs = {
      collection: 'comments',
      data: {
        targetType: payloadBody.targetType,
        targetId: payloadBody.targetId,
        authorUser: authorId && !Number.isNaN(authorId) ? authorId : undefined,
        guestName: session ? undefined : guestName || undefined,
        guestEmail: session ? undefined : guestEmail || undefined,
        content: payloadBody.content,
        status: 'pending',
        upvotes: 0,
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]

    const created = await payload.create(createArgs)

    await recordInteractionEvent({
      payload,
      event: 'comment_submitted',
      request,
      userId: session?.userId,
      targetType: 'comment',
      targetId: String(created.id),
      meta: {
        targetType: payloadBody.targetType,
        targetId: payloadBody.targetId,
      },
    })

    return Response.json({
      ok: true,
      data: {
        id: created.id,
        status: 'pending',
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
