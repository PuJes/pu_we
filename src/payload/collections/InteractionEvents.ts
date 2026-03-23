import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const InteractionEvents: CollectionConfig = {
  slug: 'interactionEvents',
  admin: {
    useAsTitle: 'event',
    defaultColumns: ['event', 'targetType', 'targetId', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: () => false,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'event',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'userId',
      type: 'text',
      index: true,
    },
    {
      name: 'anonymousId',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'targetType',
      type: 'select',
      options: [
        { label: 'Idea', value: 'idea' },
        { label: 'Feature', value: 'feature' },
        { label: 'Comment', value: 'comment' },
        { label: 'Content', value: 'content' },
        { label: 'Subscribe', value: 'subscribe' },
        { label: 'Auth', value: 'auth' },
      ],
      index: true,
    },
    {
      name: 'targetId',
      type: 'text',
      index: true,
    },
    {
      name: 'meta',
      type: 'json',
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
      fields: ['event', 'createdAt'],
    },
    {
      fields: ['anonymousId', 'createdAt'],
    },
  ],
}
