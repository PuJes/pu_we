import { NextRequest } from 'next/server'
import { z } from 'zod'

import { ApiRouteError } from '@/lib/api/error'
import { handleRouteError } from '@/lib/api/handle-route-error'
import { parseWithSchema } from '@/lib/api/zod'
import { recordInteractionEvent } from '@/lib/domain/interaction-events'
import { issueOtpChallenge } from '@/lib/domain/otp-challenges'
import { getPayloadClient } from '@/lib/payload'
import { enforceRateLimit } from '@/lib/security/rate-limit'

const sendOtpSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payloadBody = parseWithSchema(sendOtpSchema, body)

    const rateLimit = enforceRateLimit({
      key: `send-otp:${payloadBody.email.toLowerCase()}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    })

    if (!rateLimit.allowed) {
      throw new ApiRouteError('RATE_LIMITED', 'Too many OTP requests.', 429)
    }

    const payload = await getPayloadClient()
    const delivery = await issueOtpChallenge(payload, payloadBody.email)

    await recordInteractionEvent({
      payload,
      event: 'otp_sent',
      request,
      targetType: 'auth',
      meta: {
        email: payloadBody.email.toLowerCase(),
      },
    })

    return Response.json({
      ok: true,
      data: {
        sent: true,
        deliveryMode: delivery.mode,
        mockCode:
          process.env.NODE_ENV !== 'production' && delivery.mode === 'mock' ? delivery.code : undefined,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
