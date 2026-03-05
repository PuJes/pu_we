import { describe, expect, it } from 'vitest'

import { ApiRouteError } from '@/lib/api/error'
import { buildOtpPayload } from '@/lib/auth/otp'
import { validateOtpChallenge } from '@/lib/domain/otp-challenges'

type Challenge = {
  id: string
  email: string
  codeHash: string
  expiresAt: string
  attempts: number
  usedAt?: string
}

function createMockPayload(challenge: Challenge | null) {
  return {
    find: async () => ({ docs: challenge ? [challenge] : [], totalDocs: challenge ? 1 : 0 }),
    update: async ({ data }: { data: Partial<Challenge> }) => {
      if (challenge) {
        Object.assign(challenge, data)
      }
      return challenge
    },
  } as unknown as {
    find: () => Promise<{ docs: Challenge[]; totalDocs: number }>
    update: ({ data }: { data: Partial<Challenge> }) => Promise<Challenge | null>
  }
}

describe('validateOtpChallenge', () => {
  it('rejects expired otp', async () => {
    const payloadData = buildOtpPayload('expired@example.com')
    const challenge: Challenge = {
      id: '1',
      email: 'expired@example.com',
      codeHash: payloadData.codeHash,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
      attempts: 0,
    }

    const payload = createMockPayload(challenge)

    await expect(
      validateOtpChallenge({
        payload: payload as unknown as Parameters<typeof validateOtpChallenge>[0]['payload'],
        email: 'expired@example.com',
        code: payloadData.code,
      }),
    ).rejects.toMatchObject({ code: 'OTP_EXPIRED' } satisfies Partial<ApiRouteError>)
  })

  it('blocks after max retries', async () => {
    const payloadData = buildOtpPayload('retry@example.com')
    const challenge: Challenge = {
      id: '2',
      email: 'retry@example.com',
      codeHash: payloadData.codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 5,
    }

    const payload = createMockPayload(challenge)

    await expect(
      validateOtpChallenge({
        payload: payload as unknown as Parameters<typeof validateOtpChallenge>[0]['payload'],
        email: 'retry@example.com',
        code: payloadData.code,
      }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' } satisfies Partial<ApiRouteError>)
  })

  it('marks challenge used on success', async () => {
    const payloadData = buildOtpPayload('ok@example.com')
    const challenge: Challenge = {
      id: '3',
      email: 'ok@example.com',
      codeHash: payloadData.codeHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      attempts: 0,
    }

    const payload = createMockPayload(challenge)

    await validateOtpChallenge({
      payload: payload as unknown as Parameters<typeof validateOtpChallenge>[0]['payload'],
      email: 'ok@example.com',
      code: payloadData.code,
    })

    expect(challenge.usedAt).toBeDefined()
  })
})
