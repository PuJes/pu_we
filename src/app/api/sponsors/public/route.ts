import { handleRouteError } from '@/lib/api/handle-route-error'
import { ok } from '@/lib/api/response'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const sponsors = await payload.find({
      collection: 'sponsors',
      where: {
        isPublic: {
          equals: true,
        },
      },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return ok(sponsors.docs)
  } catch (error) {
    return handleRouteError(error)
  }
}
