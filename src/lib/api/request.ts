import type { NextRequest } from 'next/server'

export function getRequestIP(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return request.headers.get('x-real-ip') || '0.0.0.0'
}

export function getRequestUserAgent(request: NextRequest) {
  return request.headers.get('user-agent') || 'unknown'
}
