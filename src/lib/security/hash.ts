import { createHash } from 'node:crypto'

export function hashString(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function hashOtp(email: string, code: string, secret: string) {
  return hashString(`${email.toLowerCase()}::${code}::${secret}`)
}

export function buildUserIdentifier({
  ip,
  userAgent,
  userId,
}: {
  ip: string
  userAgent: string
  userId?: string
}) {
  if (userId) {
    return `user:${userId}`
  }

  return `anon:${hashString(`${ip}::${userAgent}`)}`
}
