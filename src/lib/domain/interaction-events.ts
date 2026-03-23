import type { NextRequest } from 'next/server'
import type { Payload } from 'payload'

import { getRequestIP, getRequestUserAgent } from '@/lib/api/request'
import { buildUserIdentifier } from '@/lib/security/hash'

type TargetType = 'idea' | 'feature' | 'comment' | 'content' | 'subscribe' | 'auth'

export async function recordInteractionEvent({
  payload,
  event,
  request,
  userId,
  targetType,
  targetId,
  meta,
}: {
  payload: Payload
  event: string
  request?: NextRequest
  userId?: string
  targetType?: TargetType
  targetId?: string
  meta?: Record<string, unknown>
}) {
  const anonymousId = request
    ? buildUserIdentifier({
        ip: getRequestIP(request),
        userAgent: getRequestUserAgent(request),
        userId,
      })
    : `server:${Date.now()}`

  try {
    const createArgs = {
      collection: 'interactionEvents',
      data: {
        event,
        userId,
        anonymousId,
        targetType,
        targetId,
        meta,
      },
      overrideAccess: true,
    } as unknown as Parameters<typeof payload.create>[0]

    await payload.create(createArgs)
  } catch {
    // Ignore analytics errors to avoid blocking main flows.
  }
}
