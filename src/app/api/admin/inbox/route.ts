import { NextRequest } from 'next/server'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { ok } from '@/lib/api/response'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || session.role !== 'admin') {
      throw new ApiRouteError('FORBIDDEN', 'Admin role required.', 403)
    }

    const payload = await getPayloadClient()
    const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [pendingIdeas, pendingComments, openFeatures, staleInProgressIdeas] = await Promise.all([
      payload.count({
        collection: 'ideas',
        where: {
          or: [{ status: { equals: 'pending' } }, { status: { equals: 'discussing' } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'comments',
        where: {
          status: {
            equals: 'pending',
          },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'features',
        where: {
          status: {
            equals: 'open',
          },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'ideas',
        where: {
          and: [
            { status: { equals: 'in-progress' } },
            { updatedAt: { less_than: staleBefore } },
          ],
        },
        overrideAccess: true,
      }),
    ])

    return ok({
      metrics: {
        pendingIdeas: pendingIdeas.totalDocs,
        pendingComments: pendingComments.totalDocs,
        openFeatures: openFeatures.totalDocs,
        staleInProgressIdeas: staleInProgressIdeas.totalDocs,
      },
      links: {
        ideas: '/admin/collections/ideas',
        comments: '/admin/collections/comments',
        features: '/admin/collections/features',
      },
      staleBefore,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
