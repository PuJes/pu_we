import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    useAsTitle: 'nickname',
    defaultColumns: ['nickname', 'amountLevel', 'channel', 'isPublic', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      if (req.user?.collection === 'admins') {
        return true
      }

      return {
        isPublic: {
          equals: true,
        },
      }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'nickname',
      type: 'text',
      required: true,
    },
    {
      name: 'amountLevel',
      type: 'select',
      required: true,
      options: [
        { label: 'Supporter', value: 'supporter' },
        { label: 'Builder', value: 'builder' },
        { label: 'Patron', value: 'patron' },
      ],
    },
    {
      name: 'channel',
      type: 'select',
      required: true,
      options: [
        { label: 'WeChat', value: 'wechat' },
        { label: 'Alipay', value: 'alipay' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'createdAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
  indexes: [
    {
      fields: ['isPublic'],
    },
  ],
}
