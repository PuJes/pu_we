import { z } from 'zod'

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('<') || trimmed.includes('>')) {
    return undefined
  }

  return trimmed
}, z.string().url().optional())

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/jesspu'),
  PAYLOAD_SECRET: z.string().min(1).default('dev-payload-secret'),
  SESSION_SECRET: z.string().min(1).default('dev-session-secret'),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: optionalUrl,
  R2_ENDPOINT: optionalUrl,
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
})

let cachedEnv: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv
  }

  cachedEnv = envSchema.parse(process.env)
  return cachedEnv
}
