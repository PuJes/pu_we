import os from 'node:os'

import { z } from 'zod'

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function getDefaultDatabaseUrl() {
  const database =
    process.env.PGDATABASE || process.env.POSTGRES_DATABASE || process.env.DATABASE_NAME || 'jesspu'
  const host = process.env.PGHOST || process.env.POSTGRES_HOST
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || '5432'
  const user =
    process.env.PGUSER ||
    process.env.POSTGRES_USER ||
    process.env.USER ||
    process.env.USERNAME ||
    os.userInfo().username ||
    'postgres'
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD

  if (host) {
    const auth = password
      ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
      : encodeURIComponent(user)

    return `postgresql://${auth}@${host}:${port}/${encodeURIComponent(database)}?sslmode=require`
  }

  return `postgresql://localhost:5432/${encodeURIComponent(database)}?user=${encodeURIComponent(user)}`
}

function getDefaultSiteUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  return 'http://localhost:3000'
}

const optionalUrl = z.preprocess((value) => {
  const normalized = emptyStringToUndefined(value)

  if (typeof normalized !== 'string') {
    return normalized
  }

  if (normalized.includes('<') || normalized.includes('>')) {
    return undefined
  }

  return normalized
}, z.string().url().optional())

const optionalString = z.preprocess(emptyStringToUndefined, z.string().optional())
const requiredString = (defaultValue: string) =>
  z.preprocess(emptyStringToUndefined, z.string().min(1).default(defaultValue))

const envSchema = z.object({
  DATABASE_URL: requiredString(getDefaultDatabaseUrl()),
  PAYLOAD_SECRET: requiredString('dev-payload-secret'),
  SESSION_SECRET: requiredString('dev-session-secret'),
  PAYLOAD_AUTO_LOGIN_EMAIL: optionalString,
  PAYLOAD_AUTO_LOGIN_USERNAME: optionalString,
  RESEND_API_KEY: optionalString,
  RESEND_FROM_EMAIL: z.preprocess(emptyStringToUndefined, z.string().email().optional()),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET: optionalString,
  R2_PUBLIC_URL: optionalUrl,
  R2_ENDPOINT: optionalUrl,
  NEXT_PUBLIC_SITE_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url().default(getDefaultSiteUrl()),
  ),
})

let cachedEnv: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  cachedEnv = envSchema.parse(process.env)
  return cachedEnv
}
