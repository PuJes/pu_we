import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Features: CollectionConfig = {
  slug: 'features',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['idea', 'status', 'voteCount'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'idea',
      type: 'relationship',
      relationTo: 'ideas',
      required: true,
      index: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'voteCount',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'builderReply',
      type: 'textarea',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Planned', value: 'planned' },
        { label: 'Done', value: 'done' },
      ],
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['idea', 'status'],
    },
  ],
}
