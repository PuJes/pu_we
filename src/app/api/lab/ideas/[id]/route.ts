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
      depth: 1,
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
      depth: 1,
    })
    const featureIds = features.docs
      .map((item) => {
        if (!item || typeof item !== 'object' || !('id' in item)) {
          return null
        }

        const featureId = (item as { id?: string | number }).id
        return typeof featureId === 'string' || typeof featureId === 'number'
          ? String(featureId)
          : null
      })
      .filter((value): value is string => Boolean(value))
    const [linkedByIdea, linkedByFeature] = await Promise.all([
      payload.find({
        collection: 'contents',
        where: {
          and: [
            { sourceIdea: { equals: idea.id } },
            { status: { equals: 'published' } },
          ],
        },
        sort: '-publishedAt',
        limit: 20,
        overrideAccess: true,
      }),
      featureIds.length > 0
        ? payload.find({
            collection: 'contents',
            where: {
              and: [
                { sourceFeature: { in: featureIds } },
                { status: { equals: 'published' } },
              ],
            },
            sort: '-publishedAt',
            limit: 20,
            overrideAccess: true,
          })
        : Promise.resolve({ docs: [] }),
    ])
    const linkedContentMap = new Map<string, unknown>()

    for (const item of [...linkedByIdea.docs, ...linkedByFeature.docs]) {
      if (!item || typeof item !== 'object' || !('id' in item)) {
        continue
      }

      const contentId = (item as { id?: string | number }).id
      if (typeof contentId !== 'string' && typeof contentId !== 'number') {
        continue
      }

      linkedContentMap.set(String(contentId), item)
    }

    return ok({
      ...idea,
      features: features.docs,
      comments: comments.docs,
      linkedContents: Array.from(linkedContentMap.values()),
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
