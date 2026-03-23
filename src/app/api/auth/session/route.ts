import { NextRequest } from 'next/server'

import { ok } from '@/lib/api/response'
import { getSessionFromRequest } from '@/lib/auth/session'
import { handleRouteError } from '@/lib/api/handle-route-error'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session) {
      return ok({ loggedIn: false })
    }

    return ok({
      loggedIn: true,
      userId: session.userId,
      email: session.email,
      role: session.role,
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
