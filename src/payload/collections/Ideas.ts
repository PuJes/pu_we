import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import {
  calculateIdeaPriorityScore,
  getIdeaAutoPromotionReason,
  normalizeIdeaPrioritySettings,
  shouldAutoPromoteIdea,
} from '../../lib/domain/idea-priority'
import { assertIdeaTransition, type IdeaStatus } from '../../lib/domain/idea-state-machine'
import { collectIdeaRecipientEmails, queueNotifications } from '../../lib/domain/notifications'
import { isAdmin } from '../access/isAdmin'
import { toSlug } from '../hooks/ensureSlug'

const STATUS_LOG_FALLBACK = 'system'

function getChangedByLabel(user: unknown) {
  if (!user || typeof user !== 'object') {
    return STATUS_LOG_FALLBACK
  }

  const maybeUser = user as { username?: string; email?: string; id?: string | number }

  if (maybeUser.username) {
    return maybeUser.username
  }

  if (maybeUser.email) {
    return maybeUser.email
  }

  if (typeof maybeUser.id === 'string' || typeof maybeUser.id === 'number') {
    return String(maybeUser.id)
  }

  return STATUS_LOG_FALLBACK
}

function getNumericValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const enrichIdeaMetadata: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  const nextData = { ...(data || {}) } as Record<string, unknown>
  const prev = originalDoc?.status as IdeaStatus | undefined
  const now = new Date().toISOString()
  const siteSettings = (await req.payload
    .findGlobal({ slug: 'siteSettings', overrideAccess: true })
    .catch(() => null)) as
    | {
        thresholds?: {
          hotIdeaVoteThreshold?: number
          priorityScoreMultiplier?: number
        }
      }
    | null
  const settings = normalizeIdeaPrioritySettings(siteSettings?.thresholds)
  const voteCount = getNumericValue(nextData.voteCount, getNumericValue(originalDoc?.voteCount))
  const impactScore = getNumericValue(nextData.impactScore, getNumericValue(originalDoc?.impactScore))
  const effortScore = getNumericValue(nextData.effortScore, getNumericValue(originalDoc?.effortScore))
  const reusabilityScore = getNumericValue(
    nextData.reusabilityScore,
    getNumericValue(originalDoc?.reusabilityScore),
  )
  const requestedStatus = (nextData.status as IdeaStatus | undefined) ?? prev ?? 'pending'

  nextData.priorityScore = calculateIdeaPriorityScore(
    {
      voteCount,
      impactScore,
      effortScore,
      reusabilityScore,
      status: requestedStatus,
    },
    settings,
  )

  if (
    shouldAutoPromoteIdea(
      {
        status: requestedStatus,
        voteCount,
      },
      settings,
    ) &&
    (!nextData.status || nextData.status === 'pending')
  ) {
    nextData.status = 'discussing'
    if (!nextData.statusChangeReason) {
      nextData.statusChangeReason = getIdeaAutoPromotionReason(settings)
    }
  }

  const next = nextData.status as IdeaStatus | undefined

  if (operation === 'create' && !nextData.statusChangedAt) {
    nextData.statusChangedAt = now
    nextData.statusChangedBy = getChangedByLabel(req.user)
  }

  if (next && prev && next !== prev) {
    assertIdeaTransition(prev, next)

    nextData.statusChangedAt = now
    nextData.statusChangedBy = getChangedByLabel(req.user)

    const reason = typeof nextData.statusChangeReason === 'string' ? nextData.statusChangeReason : ''
    const previousHistory = Array.isArray(originalDoc?.statusHistory)
      ? [...originalDoc.statusHistory]
      : []

    previousHistory.push({
      fromStatus: prev,
      toStatus: next,
      changedAt: now,
      changedBy: getChangedByLabel(req.user),
      reason,
    })

    nextData.statusHistory = previousHistory
  }

  if (Array.isArray(nextData.builderLogs) && nextData.builderLogs.length > 0) {
    const latestTimestamp = nextData.builderLogs.reduce<number | null>((latest, log) => {
      const dateValue =
        typeof log === 'object' && log && 'date' in log
          ? String((log as { date?: string }).date || '')
          : ''
      const timestamp = dateValue ? new Date(dateValue).getTime() : Number.NaN
      if (Number.isNaN(timestamp)) {
        return latest
      }

      if (latest === null || timestamp > latest) {
        return timestamp
      }
      return latest
    }, null)

    if (latestTimestamp) {
      nextData.lastBuilderUpdateAt = new Date(latestTimestamp).toISOString()
    }
  }

  if (next === 'reviewed' && !nextData.reviewedThankYouTemplate) {
    nextData.reviewedThankYouTemplate =
      '感谢每一位提出想法、参与讨论和提交功能建议的共创者。这个里程碑属于我们所有人。'
  }

  return nextData
}

const notifyIdeaStatusChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (operation !== 'update') {
    return doc
  }

  if (!previousDoc || doc.status === previousDoc.status) {
    return doc
  }

  if (!['approved', 'in-progress', 'launched', 'reviewed'].includes(String(doc.status))) {
    return doc
  }

  const recipients = await collectIdeaRecipientEmails(req.payload, String(doc.id))
  await queueNotifications(
    req.payload,
    recipients.map((email) => ({
      eventType: 'idea_status_changed' as const,
      recipientEmail: email,
      targetType: 'idea' as const,
      targetId: String(doc.id),
      payload: {
        ideaTitle: doc.title,
        status: doc.status,
        previousStatus: previousDoc.status,
      },
    })),
  )

  return doc
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
    beforeChange: [enrichIdeaMetadata],
    afterChange: [notifyIdeaStatusChange],
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
              return toSlug(value, 'idea')
            }
            if (typeof siblingData?.title === 'string') {
              return toSlug(siblingData.title, 'idea')
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
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      index: true,
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
      name: 'statusChangeReason',
      type: 'textarea',
    },
    {
      name: 'statusChangedAt',
      type: 'date',
      index: true,
    },
    {
      name: 'statusChangedBy',
      type: 'text',
    },
    {
      name: 'statusHistory',
      type: 'array',
      fields: [
        {
          name: 'fromStatus',
          type: 'text',
          required: true,
        },
        {
          name: 'toStatus',
          type: 'text',
          required: true,
        },
        {
          name: 'changedAt',
          type: 'date',
          required: true,
        },
        {
          name: 'changedBy',
          type: 'text',
          required: true,
        },
        {
          name: 'reason',
          type: 'textarea',
        },
      ],
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
    {
      name: 'lastBuilderUpdateAt',
      type: 'date',
      index: true,
    },
    {
      name: 'reviewedThankYouTemplate',
      type: 'textarea',
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
