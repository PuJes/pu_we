import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { collectIdeaRecipientEmails, queueNotifications } from '../../lib/domain/notifications'
import { isAdmin } from '../access/isAdmin'

const enrichFeatureMetadata: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
}) => {
  const nextData = { ...(data || {}) } as Record<string, unknown>
  const nextStatus = nextData.status as string | undefined
  const prevStatus = originalDoc?.status as string | undefined
  const now = new Date().toISOString()

  if (operation === 'create' && !nextData.statusChangedAt) {
    nextData.statusChangedAt = now
  }

  if (nextStatus && prevStatus && nextStatus !== prevStatus) {
    nextData.statusChangedAt = now
  }

  const nextReply = typeof nextData.builderReply === 'string' ? nextData.builderReply.trim() : ''
  const prevReply = typeof originalDoc?.builderReply === 'string' ? originalDoc.builderReply.trim() : ''
  if (nextReply && nextReply !== prevReply) {
    nextData.adminReplyAt = now
  }

  return nextData
}

const notifyFeatureDone: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') {
    return doc
  }

  if (doc.status !== 'done' || previousDoc?.status === 'done') {
    return doc
  }

  const ideaId =
    typeof doc.idea === 'string' || typeof doc.idea === 'number'
      ? String(doc.idea)
      : doc.idea && typeof doc.idea === 'object' && 'id' in doc.idea
        ? String((doc.idea as { id: string | number }).id)
        : ''

  if (!ideaId) {
    return doc
  }

  const recipients = await collectIdeaRecipientEmails(req.payload, ideaId)
  await queueNotifications(
    req.payload,
    recipients.map((email) => ({
      eventType: 'feature_done' as const,
      recipientEmail: email,
      targetType: 'feature' as const,
      targetId: String(doc.id),
      payload: {
        ideaId,
        featureContent: doc.content,
      },
    })),
  )

  return doc
}

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
  hooks: {
    beforeChange: [enrichFeatureMetadata],
    afterChange: [notifyFeatureDone],
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
      name: 'adminReplyAt',
      type: 'date',
      index: true,
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
    {
      name: 'statusChangeReason',
      type: 'textarea',
    },
    {
      name: 'statusChangedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'isAdopted',
      type: 'checkbox',
      defaultValue: false,
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['idea', 'status'],
    },
  ],
}
