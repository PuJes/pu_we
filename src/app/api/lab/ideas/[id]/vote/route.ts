import { NextRequest } from 'next/server'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { getRequestIP, getRequestUserAgent } from '@/lib/api/request'
import { getSessionFromRequest } from '@/lib/auth/session'
import { registerVote } from '@/lib/domain/votes'
import { getPayloadClient } from '@/lib/payload'
import { buildUserIdentifier } from '@/lib/security/hash'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const payload = await getPayloadClient()

    const session = await getSessionFromRequest(request)
    const userIdentifier = buildUserIdentifier({
      ip: getRequestIP(request),
      userAgent: getRequestUserAgent(request),
      userId: session?.userId,
    })

    const result = await registerVote({
      payload,
      targetType: 'idea',
      targetId: id,
      userIdentifier,
      userId: session?.userId,
    })

    if (result.duplicated) {
      throw new ApiRouteError('DUPLICATE_VOTE', 'You have already voted for this idea.', 409)
    }

    return Response.json({
      ok: true,
      data: {
        voted: true,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
