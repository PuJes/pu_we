import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'recipientEmail',
    defaultColumns: ['eventType', 'recipientEmail', 'status', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Idea Status Changed', value: 'idea_status_changed' },
        { label: 'Comment Approved', value: 'comment_approved' },
        { label: 'Feature Done', value: 'feature_done' },
      ],
      index: true,
    },
    {
      name: 'recipientEmail',
      type: 'email',
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
        { label: 'System', value: 'system' },
      ],
      index: true,
    },
    {
      name: 'targetId',
      type: 'text',
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      index: true,
    },
    {
      name: 'payload',
      type: 'json',
    },
    {
      name: 'sentAt',
      type: 'date',
    },
    {
      name: 'retryCount',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'lastError',
      type: 'textarea',
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
      fields: ['status', 'createdAt'],
    },
    {
      fields: ['targetType', 'targetId'],
    },
  ],
}
