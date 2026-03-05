import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { assertIdeaTransition, type IdeaStatus } from '../../lib/domain/idea-state-machine'
import { isAdmin } from '../access/isAdmin'
import { toSlug } from '../hooks/ensureSlug'

const enforceStatusMachine: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const next = data?.status as IdeaStatus | undefined
  const prev = originalDoc?.status as IdeaStatus | undefined

  if (!next || !prev || next === prev) {
    return data
  }

  assertIdeaTransition(prev, next)
  return data
}

export const Ideas: CollectionConfig = {
  slug: 'ideas',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priorityScore', 'voteCount'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [enforceStatusMachine],
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
              return toSlug(value)
            }
            if (typeof siblingData?.title === 'string') {
              return toSlug(siblingData.title)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
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
        { label: 'Discussing', value: 'discussing' },
        { label: 'Approved', value: 'approved' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Launched', value: 'launched' },
        { label: 'Reviewed', value: 'reviewed' },
      ],
      index: true,
    },
    {
      name: 'priorityScore',
      type: 'number',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'voteCount',
      type: 'number',
      defaultValue: 0,
      required: true,
      index: true,
    },
    {
      name: 'impactScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'effortScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'reusabilityScore',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'targetVersion',
      type: 'text',
    },
    {
      name: 'builderLogs',
      type: 'array',
      fields: [
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'version',
          type: 'text',
        },
        {
          name: 'content',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ],
  indexes: [
    {
      fields: ['slug'],
      unique: true,
    },
    {
      fields: ['status', 'priorityScore'],
    },
  ],
}
