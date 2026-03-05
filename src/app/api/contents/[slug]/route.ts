import { handleRouteError } from '@/lib/api/handle-route-error'
import { fail, ok } from '@/lib/api/response'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const payload = await getPayloadClient()
    const { slug } = await params

    const result = await payload.find({
      collection: 'contents',
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            status: {
              equals: 'published',
            },
          },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    const content = result.docs[0]

    if (!content) {
      return fail('NOT_FOUND', 'Content not found.', 404)
    }

    const comments = await payload.find({
      collection: 'comments',
      where: {
        and: [
          { targetType: { equals: 'content' } },
          { targetId: { equals: String(content.id) } },
          { status: { equals: 'approved' } },
        ],
      },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return ok({
      ...content,
      comments: comments.docs,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
