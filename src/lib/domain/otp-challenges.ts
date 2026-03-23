import type { Payload } from 'payload'

import { ApiRouteError } from '@/lib/api/error'
import { buildOtpPayload, OTP_MAX_ATTEMPTS, sendOtpEmail, verifyOtpCode } from '@/lib/auth/otp'

const OTP_SEND_GAP_MS = 60 * 1000
const OTP_HOURLY_LIMIT = 6

export async function issueOtpChallenge(payload: Payload, email: string) {
  const normalizedEmail = email.toLowerCase()
  const now = new Date()

  const recentChallenges = await payload.find({
    collection: 'otpChallenges',
    where: {
      and: [
        { email: { equals: normalizedEmail } },
        {
          createdAt: {
            greater_than: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          },
        },
      ],
    },
    limit: 10,
    sort: '-createdAt',
    overrideAccess: true,
  })

  if (recentChallenges.totalDocs >= OTP_HOURLY_LIMIT) {
    throw new ApiRouteError('RATE_LIMITED', 'OTP request limit reached for this hour.', 429)
  }

  const latest = recentChallenges.docs[0]

  if (latest?.createdAt) {
    const lastCreatedAt = new Date(latest.createdAt).getTime()
    if (Date.now() - lastCreatedAt < OTP_SEND_GAP_MS) {
      throw new ApiRouteError('RATE_LIMITED', 'Please wait before requesting another OTP.', 429)
    }
  }

  const active = await payload.find({
    collection: 'otpChallenges',
    where: {
      and: [{ email: { equals: normalizedEmail } }, { usedAt: { exists: false } }],
    },
    limit: 5,
    overrideAccess: true,
  })

  await Promise.all(
    active.docs.map((doc) =>
      payload.update({
        collection: 'otpChallenges',
        id: doc.id,
        data: { usedAt: now.toISOString() },
        overrideAccess: true,
      }),
    ),
  )

  const otp = buildOtpPayload(normalizedEmail)

  await payload.create({
    collection: 'otpChallenges',
    data: {
      email: normalizedEmail,
      codeHash: otp.codeHash,
      expiresAt: otp.expiresAt,
      attempts: 0,
    },
    overrideAccess: true,
  })

  return sendOtpEmail({ email: normalizedEmail, code: otp.code })
}

export async function validateOtpChallenge({
  payload,
  email,
  code,
}: {
  payload: Payload
  email: string
  code: string
}) {
  const normalizedEmail = email.toLowerCase()

  const result = await payload.find({
    collection: 'otpChallenges',
    where: {
      and: [{ email: { equals: normalizedEmail } }, { usedAt: { exists: false } }],
    },
    limit: 1,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const challenge = result.docs[0]

  if (!challenge) {
    throw new ApiRouteError('OTP_EXPIRED', 'No active OTP challenge found.', 400)
  }

  const now = new Date()
  const expiresAt = challenge.expiresAt ? new Date(challenge.expiresAt) : null

  if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
    await payload.update({
      collection: 'otpChallenges',
      id: challenge.id,
      data: { usedAt: now.toISOString() },
      overrideAccess: true,
    })

    throw new ApiRouteError('OTP_EXPIRED', 'OTP has expired.', 400)
  }

  const attempts = challenge.attempts ?? 0
  if (attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiRouteError('RATE_LIMITED', 'Too many failed OTP attempts.', 429)
  }

  const isValid = verifyOtpCode({
    email: normalizedEmail,
    code,
    codeHash: challenge.codeHash,
  })

  if (!isValid) {
    const nextAttempts = attempts + 1

    await payload.update({
      collection: 'otpChallenges',
      id: challenge.id,
      data: {
        attempts: nextAttempts,
        usedAt: nextAttempts >= OTP_MAX_ATTEMPTS ? now.toISOString() : undefined,
      },
      overrideAccess: true,
    })

    if (nextAttempts >= OTP_MAX_ATTEMPTS) {
      throw new ApiRouteError('RATE_LIMITED', 'Too many failed OTP attempts.', 429)
    }

    throw new ApiRouteError('INVALID_INPUT', 'OTP code is incorrect.', 400)
  }

  await payload.update({
    collection: 'otpChallenges',
    id: challenge.id,
    data: { usedAt: now.toISOString() },
    overrideAccess: true,
  })
}
