import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { toSlug } from '../hooks/ensureSlug'

export const Contents: CollectionConfig = {
  slug: 'contents',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [
          ({ siblingData, value }) => {
            if (typeof value === 'string' && value.length > 0) {
              return toSlug(value, 'content')
            }
            if (typeof siblingData?.title === 'string') {
              return toSlug(siblingData.title, 'content')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'article',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Video', value: 'video' },
        { label: 'Podcast', value: 'podcast' },
        { label: 'Repo', value: 'repo' },
        { label: 'Snippet', value: 'snippet' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'AI Experiments', value: 'ai-experiments' },
        { label: 'Business Analysis', value: 'business-analysis' },
        { label: 'My Story', value: 'my-story' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'takeaways',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData.category === 'ai-experiments',
      },
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'keyArgument',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData.category === 'business-analysis',
      },
    },
    {
      name: 'analysisFramework',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData.category === 'business-analysis',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData.category === 'my-story',
      },
    },
    {
      name: 'snippet',
      type: 'textarea',
    },
    {
      name: 'articleBody',
      type: 'textarea',
    },
    {
      name: 'externalLink',
      type: 'text',
    },
    {
      name: 'sourceIdea',
      type: 'relationship',
      relationTo: 'ideas',
      index: true,
    },
    {
      name: 'sourceFeature',
      type: 'relationship',
      relationTo: 'features',
      index: true,
    },
    {
      name: 'contributorThanks',
      type: 'textarea',
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      index: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['slug'],
      unique: true,
    },
    {
      fields: ['category', 'status'],
    },
  ],
}
