import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'DUPLICATE_VOTE'
  | 'OTP_EXPIRED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'

export type ApiSuccess<T> = { ok: true; data: T }
export type ApiFailure = {
  ok: false
  error: {
    code: ApiErrorCode
    message: string
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init)
}

export function fail(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: { code, message },
    },
    { status },
  )
}
