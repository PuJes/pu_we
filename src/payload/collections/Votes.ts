import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Votes: CollectionConfig = {
  slug: 'votes',
  admin: {
    useAsTitle: 'targetId',
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Idea', value: 'idea' },
        { label: 'Feature', value: 'feature' },
      ],
      index: true,
    },
    {
      name: 'targetId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'userIdentifier',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'userId',
      type: 'text',
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['targetType', 'targetId', 'userIdentifier'],
      unique: true,
    },
  ],
}
