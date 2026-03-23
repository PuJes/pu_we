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
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      voteEvents,
      commentEvents,
      featureEvents,
      ideaEvents,
      reviewedIdeas,
      pendingIdeas,
      openFeatures,
      pendingComments,
    ] = await Promise.all([
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'idea_vote_success' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'comment_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'feature_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'idea_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'ideas',
        where: {
          and: [{ status: { equals: 'reviewed' } }, { updatedAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'ideas',
        where: {
          or: [{ status: { equals: 'pending' } }, { status: { equals: 'discussing' } }],
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
        collection: 'comments',
        where: {
          status: {
            equals: 'pending',
          },
        },
        overrideAccess: true,
      }),
    ])

    return ok({
      since,
      funnel: {
        labToVote: voteEvents.totalDocs,
        voteToComment: commentEvents.totalDocs,
        commentToFeature: featureEvents.totalDocs,
        featureToLaunch: reviewedIdeas.totalDocs,
      },
      weeklyActivities: {
        newIdeas: ideaEvents.totalDocs,
        newFeatures: featureEvents.totalDocs,
        newComments: commentEvents.totalDocs,
        reviewedIdeas: reviewedIdeas.totalDocs,
      },
      backlog: {
        pendingIdeas: pendingIdeas.totalDocs,
        openFeatures: openFeatures.totalDocs,
        pendingComments: pendingComments.totalDocs,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
