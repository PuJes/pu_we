import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const OtpChallenges: CollectionConfig = {
  slug: 'otpChallenges',
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: () => true,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      index: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      index: true,
    },
    {
      name: 'usedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'attempts',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
  ],
  indexes: [
    {
      fields: ['email', 'usedAt'],
    },
    {
      fields: ['expiresAt'],
    },
  ],
}
