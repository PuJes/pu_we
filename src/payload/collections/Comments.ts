import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['targetType', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      if (req.user?.collection === 'admins') {
        return true
      }

      return {
        status: {
          equals: 'approved',
        },
      }
    },
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'targetType',
      type: 'select',
      required: true,
      options: [
        { label: 'Content', value: 'content' },
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
      name: 'authorUser',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'guestName',
      type: 'text',
    },
    {
      name: 'guestEmail',
      type: 'email',
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      index: true,
    },
    {
      name: 'upvotes',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
  ],
  indexes: [
    {
      fields: ['targetType', 'targetId', 'status'],
    },
  ],
}
