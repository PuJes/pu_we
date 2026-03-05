import type { GlobalConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'subscribeCopy',
      type: 'textarea',
    },
    {
      name: 'qrImages',
      type: 'group',
      fields: [
        {
          name: 'wechat',
          type: 'relationship',
          relationTo: 'media',
        },
        {
          name: 'alipay',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'thresholds',
      type: 'group',
      fields: [
        {
          name: 'hotIdeaVoteThreshold',
          type: 'number',
          defaultValue: 20,
        },
        {
          name: 'priorityScoreMultiplier',
          type: 'number',
          defaultValue: 1,
        },
      ],
    },
  ],
}
