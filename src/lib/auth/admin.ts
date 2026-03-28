import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createLocalReq, generateExpiredPayloadCookie, generatePayloadCookie, getFieldsToSign, jwtSign } from 'payload'
import { addSessionToUser } from 'payload/shared'

import { getPayloadClient } from '@/lib/payload'
import { getSessionFromCookies, getSessionFromRequest, type FrontendSession } from '@/lib/auth/session'

const PAYLOAD_COOKIE_PREFIX = 'payload'

function normalizeAdminPath(value: string | null | undefined, fallback: string) {
  if (!value || !value.startsWith('/')) {
    return fallback
  }

  if (value.startsWith('/admin-dashboard') || value.startsWith('/admin')) {
    return value
  }

  return fallback
}

export function getPayloadAuthCookieName() {
  return `${PAYLOAD_COOKIE_PREFIX}-token`
}

export function buildAdminLoginHref(nextPath?: string | null) {
  const next = normalizeAdminPath(nextPath, '/admin-dashboard')
  return `/admin-login?next=${encodeURIComponent(next)}`
}

export function buildAdminBridgeHref(nextPath?: string | null) {
  const next = normalizeAdminPath(nextPath, '/admin')
  return `/admin/bridge?next=${encodeURIComponent(next)}`
}

export async function hasPayloadAdminCookie() {
  const cookieStore = await cookies()
  return Boolean(cookieStore.get(getPayloadAuthCookieName())?.value)
}

export async function requireAdminFrontendSession(nextPath: string): Promise<FrontendSession> {
  const session = await getSessionFromCookies()

  if (!session || session.role !== 'admin') {
    redirect(buildAdminLoginHref(nextPath))
  }

  return session
}

export async function resolveAdminFrontendSessionFromRequest(request: Request) {
  const nextRequest = request as unknown as Parameters<typeof getSessionFromRequest>[0]
  const session = await getSessionFromRequest(nextRequest)

  if (!session || session.role !== 'admin') {
    return null
  }

  return session
}

export async function resolvePayloadAdminEntryRedirect(nextPath: string) {
  if (await hasPayloadAdminCookie()) {
    return null
  }

  const session = await getSessionFromCookies()
  if (session?.role === 'admin') {
    return buildAdminBridgeHref(nextPath)
  }

  return buildAdminLoginHref(nextPath)
}

export async function issuePayloadAdminCookie(email: string) {
  const normalizedEmail = email.toLowerCase().trim()
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'admins',
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
    limit: 1,
    overrideAccess: true,
  })

  const admin = result.docs[0]
  if (!admin) {
    return null
  }

  const collectionConfig = payload.collections.admins.config
  const authConfig = collectionConfig.auth
  if (!authConfig) {
    return null
  }

  const req = await createLocalReq(
    {
      user: {
        ...admin,
        collection: 'admins',
      } as typeof admin & { collection: 'admins' },
    },
    payload,
  )

  const adminWithCollection = {
    ...admin,
    collection: 'admins',
  } as typeof admin & { collection: 'admins' }

  const { sid } = await addSessionToUser({
    collectionConfig,
    payload,
    req,
    user: adminWithCollection,
  })

  const fieldsToSign = getFieldsToSign({
    collectionConfig,
    email: normalizedEmail,
    sid,
    user: adminWithCollection,
  })

  const { token } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: authConfig.tokenExpiration,
  })

  return {
    authConfig,
    cookie: generatePayloadCookie({
      collectionAuthConfig: authConfig,
      cookiePrefix: payload.config.cookiePrefix || PAYLOAD_COOKIE_PREFIX,
      returnCookieAsObject: true,
      token,
    }),
  }
}

export async function getExpiredPayloadAdminCookie() {
  const payload = await getPayloadClient()
  const authConfig = payload.collections.admins.config.auth

  if (!authConfig) {
    return null
  }

  return generateExpiredPayloadCookie({
    collectionAuthConfig: authConfig,
    cookiePrefix: payload.config.cookiePrefix || PAYLOAD_COOKIE_PREFIX,
    returnCookieAsObject: true,
  })
}
