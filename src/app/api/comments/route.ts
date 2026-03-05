import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
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

    const session = await getSessionFromRequest(request)
    if (!session && !payloadBody.guestName) {
      throw new ApiRouteError('INVALID_INPUT', 'Guest name is required if not logged in.', 400)
    }

    const payload = await getPayloadClient()
    const authorId = session?.userId ? Number(session.userId) : undefined

    const createArgs = {
      collection: 'comments',
      data: {
        targetType: payloadBody.targetType,
        targetId: payloadBody.targetId,
        authorUser: authorId && !Number.isNaN(authorId) ? authorId : undefined,
        guestName: payloadBody.guestName,
        guestEmail: payloadBody.guestEmail,
        content: payloadBody.content,
        status: 'pending',
        upvotes: 0,
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]

    const created = await payload.create(createArgs)

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
