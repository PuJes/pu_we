import { NextRequest, NextResponse } from 'next/server'

import { buildAdminLoginHref, issuePayloadAdminCookie, resolveAdminFrontendSessionFromRequest } from '@/lib/auth/admin'

function normalizeNextPath(request: NextRequest) {
  const value = request.nextUrl.searchParams.get('next')

  if (value && (value.startsWith('/admin') || value.startsWith('/admin-dashboard'))) {
    return value
  }

  return '/admin'
}

export async function GET(request: NextRequest) {
  const nextPath = normalizeNextPath(request)
  const session = await resolveAdminFrontendSessionFromRequest(request)

  if (!session) {
    return NextResponse.redirect(new URL(buildAdminLoginHref(nextPath), request.url))
  }

  const payloadCookie = await issuePayloadAdminCookie(session.email)
  if (!payloadCookie) {
    return NextResponse.redirect(new URL(buildAdminLoginHref(nextPath), request.url))
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url))
  if (!payloadCookie.cookie.value) {
    return NextResponse.redirect(new URL(buildAdminLoginHref(nextPath), request.url))
  }

  response.cookies.set(payloadCookie.cookie.name, payloadCookie.cookie.value, {
    domain: payloadCookie.cookie.domain,
    expires: payloadCookie.cookie.expires ? new Date(payloadCookie.cookie.expires) : undefined,
    httpOnly: true,
    path: payloadCookie.cookie.path || '/',
    sameSite:
      typeof payloadCookie.authConfig.cookies.sameSite === 'string'
        ? payloadCookie.authConfig.cookies.sameSite.toLowerCase() as 'lax' | 'strict' | 'none'
        : 'lax',
    secure: payloadCookie.authConfig.cookies.secure || false,
  })

  return response
}
