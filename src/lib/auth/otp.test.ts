import { describe, expect, it } from 'vitest'

import { buildOtpPayload, verifyOtpCode } from '@/lib/auth/otp'

describe('otp utilities', () => {
  it('builds hash and verifies correctly', () => {
    const email = 'test@example.com'
    const payload = buildOtpPayload(email)

    expect(payload.code).toHaveLength(6)
    expect(verifyOtpCode({ email, code: payload.code, codeHash: payload.codeHash })).toBe(true)
    expect(verifyOtpCode({ email, code: '000000', codeHash: payload.codeHash })).toBe(false)
  })

  it('sets expiration within 10 minutes', () => {
    const payload = buildOtpPayload('time@example.com')
    const expiresAt = new Date(payload.expiresAt).getTime()
    const delta = expiresAt - Date.now()

    expect(delta).toBeGreaterThan(9 * 60 * 1000)
    expect(delta).toBeLessThanOrEqual(10 * 60 * 1000)
  })
})
