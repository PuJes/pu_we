import { NextResponse } from 'next/server'

import { getExpiredPayloadAdminCookie } from '@/lib/auth/admin'
import { clearSessionCookie } from '@/lib/auth/session'

export async function POST() {
  const response = NextResponse.json({
    ok: true,
    data: {
      loggedOut: true,
    },
  })

  clearSessionCookie(response)

  const payloadCookie = await getExpiredPayloadAdminCookie()
  if (payloadCookie?.value) {
    response.cookies.set(payloadCookie.name, payloadCookie.value, {
      domain: payloadCookie.domain,
      expires: payloadCookie.expires ? new Date(payloadCookie.expires) : undefined,
      httpOnly: true,
      path: payloadCookie.path || '/',
      sameSite:
        typeof payloadCookie.sameSite === 'string'
          ? payloadCookie.sameSite.toLowerCase() as 'lax' | 'strict' | 'none'
          : 'lax',
      secure: payloadCookie.secure || false,
    })
  }

  return response
}
