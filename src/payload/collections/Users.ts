import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'nickname',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
    },
    {
      name: 'isSubscribed',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
    {
      name: 'lastLoginAt',
      type: 'date',
    },
  ],
  indexes: [
    {
      fields: ['email'],
      unique: true,
    },
  ],
}
