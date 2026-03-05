import { handleRouteError } from '@/lib/api/handle-route-error'
import { fail, ok } from '@/lib/api/response'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayloadClient()

    const ideas = await payload.find({
      collection: 'ideas',
      where: {
        slug: {
          equals: id,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    const idea = ideas.docs[0]

    if (!idea) {
      return fail('NOT_FOUND', 'Idea not found.', 404)
    }

    const features = await payload.find({
      collection: 'features',
      where: {
        idea: {
          equals: idea.id,
        },
      },
      sort: '-voteCount',
      limit: 100,
      overrideAccess: true,
    })

    const comments = await payload.find({
      collection: 'comments',
      where: {
        and: [
          {
            targetType: {
              equals: 'idea',
            },
          },
          {
            targetId: {
              equals: String(idea.id),
            },
          },
          {
            status: {
              equals: 'approved',
            },
          },
        ],
      },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return ok({
      ...idea,
      features: features.docs,
      comments: comments.docs,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
