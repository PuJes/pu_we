import { jwtVerify, SignJWT } from 'jose'
import type { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { getEnv } from '@/lib/env'

const SESSION_COOKIE_NAME = 'jesspu_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export type FrontendSession = {
  userId: string
  email: string
  role: 'user' | 'admin'
}

function getSessionSecret() {
  const env = getEnv()
  return new TextEncoder().encode(env.SESSION_SECRET)
}

export async function signSession(session: FrontendSession) {
  const token = await new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret())

  return token
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, getSessionSecret())

  return payload as FrontendSession
}

export async function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    return await verifySession(token)
  } catch {
    return null
  }
}

export async function getSessionFromCookies() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    return await verifySession(token)
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
  })
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  })
}

export { SESSION_COOKIE_NAME }
