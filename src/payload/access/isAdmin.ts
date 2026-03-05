import type { Access } from 'payload'
import type { PayloadRequest } from 'payload'

export const isAdmin: Access = ({ req }) => {
  return isAdminRequest(req)
}

export function isAdminRequest(req: PayloadRequest) {
  const user = req.user
  return Boolean(user && req.user?.collection === 'admins')
}
