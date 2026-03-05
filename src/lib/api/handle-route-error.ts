import { ApiRouteError } from '@/lib/api/error'
import { fail } from '@/lib/api/response'

export function handleRouteError(error: unknown) {
  if (error instanceof ApiRouteError) {
    return fail(error.code, error.message, error.status)
  }

  console.error(error)
  return fail('INTERNAL_ERROR', 'Unexpected server error.', 500)
}
