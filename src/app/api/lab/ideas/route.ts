import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { getSessionFromRequest } from '@/lib/auth/session'
import { recordInteractionEvent } from '@/lib/domain/interaction-events'
import { getPayloadClient } from '@/lib/payload'

const createIdeaSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1200),
})

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') === 'latest' ? 'latest' : 'hot'

    const payload = await getPayloadClient()

    const ideas = await payload.find({
      collection: 'ideas',
      where: status
        ? {
            status: {
              equals: status,
            },
          }
        : undefined,
      sort: sort === 'hot' ? '-priorityScore' : '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return Response.json({ ok: true, data: ideas.docs })
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) {
      throw new ApiRouteError('UNAUTHORIZED', 'Please verify OTP before submitting ideas.', 401)
    }

    const body = await request.json()
    const payloadBody = parseWithSchema(createIdeaSchema, body)

    const payload = await getPayloadClient()
    const authorId = Number(session.userId)

    const createArgs = {
      collection: 'ideas',
      data: {
        title: payloadBody.title,
        description: payloadBody.description,
        author: Number.isNaN(authorId) ? undefined : authorId,
        status: 'pending',
        priorityScore: 0,
        voteCount: 0,
        impactScore: 0,
        effortScore: 0,
        reusabilityScore: 0,
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]

    const created = await payload.create(createArgs)

    const createdIdea = created as { id: string | number; status?: string }

    await recordInteractionEvent({
      payload,
      event: 'idea_submitted',
      request,
      userId: session.userId,
      targetType: 'idea',
      targetId: String(createdIdea.id),
      meta: {
        status: createdIdea.status,
      },
    })

    return Response.json({ ok: true, data: created }, { status: 201 })
  } catch (error) {
    return handleRouteError(error)
  }
}
