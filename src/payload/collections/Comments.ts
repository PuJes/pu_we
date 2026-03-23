import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { queueNotifications, resolveUserEmailByRelation } from '../../lib/domain/notifications'
import { isAdmin } from '../access/isAdmin'

const enrichReviewMetadata: CollectionBeforeChangeHook = ({ data, originalDoc, req }) => {
  const nextData = { ...(data || {}) } as Record<string, unknown>
  const nextStatus = nextData.status as string | undefined
  const prevStatus = originalDoc?.status as string | undefined

  if (!nextStatus || !prevStatus || nextStatus === prevStatus) {
    return nextData
  }

  if (nextStatus === 'approved' || nextStatus === 'rejected') {
    nextData.reviewedAt = new Date().toISOString()
    const adminId =
      req.user && typeof req.user === 'object' && 'id' in req.user
        ? (req.user as { id?: string | number }).id
        : undefined

    if (adminId) {
      nextData.reviewedBy = adminId
    }
  }

  return nextData
}

const notifyCommentApproved: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') {
    return doc
  }

  if (doc.status !== 'approved' || previousDoc?.status === 'approved') {
    return doc
  }

  const recipient =
    (typeof doc.guestEmail === 'string' && doc.guestEmail) ||
    (await resolveUserEmailByRelation(req.payload, doc.authorUser))

  if (!recipient) {
    return doc
  }

  await queueNotifications(req.payload, [
    {
      eventType: 'comment_approved',
      recipientEmail: recipient,
      targetType: 'comment',
      targetId: String(doc.id),
      payload: {
        targetType: doc.targetType,
        targetId: doc.targetId,
      },
    },
  ])

  return doc
}

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
  hooks: {
    beforeChange: [enrichReviewMetadata],
    afterChange: [notifyCommentApproved],
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
      name: 'reviewedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'admins',
      index: true,
    },
    {
      name: 'reviewReason',
      type: 'textarea',
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
