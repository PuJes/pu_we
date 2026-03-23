import { NextRequest } from 'next/server'
import { Resend } from 'resend'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { ok } from '@/lib/api/response'
import { getSessionFromRequest } from '@/lib/auth/session'
import { dispatchPendingNotifications } from '@/lib/domain/notifications'
import { getEnv } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session || session.role !== 'admin') {
      throw new ApiRouteError('FORBIDDEN', 'Admin role required.', 403)
    }

    const payload = await getPayloadClient()
    const env = getEnv()
    const resend =
      env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? new Resend(env.RESEND_API_KEY) : null
    const result = await dispatchPendingNotifications(payload, {
      resend,
      fromEmail: env.RESEND_FROM_EMAIL || null,
    })

    return ok({
      queued: result.queued,
      sent: result.sent,
      failed: result.failed,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
