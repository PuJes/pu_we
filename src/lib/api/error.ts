import type { ApiErrorCode } from '@/lib/api/response'

export class ApiRouteError extends Error {
  code: ApiErrorCode
  status: number

  constructor(code: ApiErrorCode, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}
