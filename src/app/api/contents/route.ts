import { NextRequest } from 'next/server'

import { handleRouteError } from '@/lib/api/handle-route-error'
import { ok } from '@/lib/api/response'
import { getPayloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category')

    const payload = await getPayloadClient()
    const contents = await payload.find({
      collection: 'contents',
      where: {
        and: [
          {
            status: {
              equals: 'published',
            },
          },
          ...(category
            ? [
                {
                  category: {
                    equals: category,
                  },
                },
              ]
            : []),
        ],
      },
      sort: '-publishedAt',
      limit: 100,
      overrideAccess: true,
    })

    return ok(contents.docs)
  } catch (error) {
    return handleRouteError(error)
  }
}
