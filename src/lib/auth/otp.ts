import { randomInt } from 'node:crypto'

import { Resend } from 'resend'

import { getEnv } from '@/lib/env'
import { hashOtp } from '@/lib/security/hash'

export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5

export type OtpSendResult = {
  code: string
  codeHash: string
  expiresAt: string
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999))
}

export function buildOtpPayload(email: string): OtpSendResult {
  const env = getEnv()
  const code = generateOtpCode()
  const codeHash = hashOtp(email, code, env.SESSION_SECRET)
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString()

  return {
    code,
    codeHash,
    expiresAt,
  }
}

export function verifyOtpCode({
  code,
  email,
  codeHash,
}: {
  code: string
  email: string
  codeHash: string
}) {
  const env = getEnv()
  const incomingHash = hashOtp(email, code, env.SESSION_SECRET)

  return incomingHash === codeHash
}

export async function sendOtpEmail({
  email,
  code,
}: {
  email: string
  code: string
}) {
  const env = getEnv()

  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    console.info(`[OTP MOCK] send ${code} to ${email}`)
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)

  await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: email,
    subject: 'Your JESS.PU verification code',
    html: `<p>Your OTP code is <strong>${code}</strong>. It expires in ${OTP_TTL_MINUTES} minutes.</p>`,
  })
}
