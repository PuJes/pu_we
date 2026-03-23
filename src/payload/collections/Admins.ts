import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminRequest } from '../access/isAdmin'

export const Admins: CollectionConfig = {
  slug: 'admins',
  admin: {
    useAsTitle: 'username',
  },
  auth: {
    loginWithUsername: {
      allowEmailLogin: true,
      requireEmail: false,
      requireUsername: true,
    },
  },
  access: {
    admin: ({ req }) => isAdminRequest(req),
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'admin',
      options: [{ label: 'Admin', value: 'admin' }],
      access: {
        update: () => false,
      },
    },
  ],
}
