import type { Payload } from 'payload'
import type { Resend } from 'resend'

type NotificationEventType = 'idea_status_changed' | 'comment_approved' | 'feature_done'

type QueueNotificationInput = {
  eventType: NotificationEventType
  recipientEmail: string
  targetType?: 'idea' | 'feature' | 'comment' | 'content' | 'system'
  targetId?: string
  payload?: Record<string, unknown>
}

type NotificationDispatchInput = {
  eventType?: string | null
  payload?: Record<string, unknown> | null
}

export function buildNotificationMailContent(notification: NotificationDispatchInput) {
  if (notification.eventType === 'idea_status_changed') {
    const status = String(notification.payload?.status || 'updated')
    const ideaTitle = String(notification.payload?.ideaTitle || '你的关注事项')
    return {
      subject: `[Open Lab] Idea 状态更新：${status}`,
      html: `<p>你关注的 Idea <strong>${ideaTitle}</strong> 已更新为 <strong>${status}</strong>。</p>`,
    }
  }

  if (notification.eventType === 'comment_approved') {
    return {
      subject: '[Open Lab] 你的评论已通过审核',
      html: '<p>你的评论已通过审核，欢迎继续参与共创讨论。</p>',
    }
  }

  if (notification.eventType === 'feature_done') {
    return {
      subject: '[Open Lab] 功能建议已完成',
      html: '<p>你关注的功能建议已进入完成状态，欢迎查看最新进展。</p>',
    }
  }

  return {
    subject: '[Open Lab] 新通知',
    html: '<p>你有一条新的共创通知。</p>',
  }
}

function relationToId(value: unknown) {
  if (!value) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'object' && value && 'id' in value) {
    const maybeId = (value as { id?: string | number }).id
    if (typeof maybeId === 'string' || typeof maybeId === 'number') {
      return String(maybeId)
    }
  }

  return null
}

export async function resolveUserEmailByRelation(payload: Payload, value: unknown) {
  const userId = relationToId(value)
  if (!userId) {
    return null
  }

  try {
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    })
    return user?.email || null
  } catch {
    return null
  }
}

export async function collectIdeaRecipientEmails(payload: Payload, ideaId: string) {
  const emails = new Set<string>()

  try {
    const idea = (await payload.findByID({
      collection: 'ideas',
      id: ideaId,
      overrideAccess: true,
    })) as { author?: unknown }
    const authorEmail = await resolveUserEmailByRelation(payload, idea.author)
    if (authorEmail) {
      emails.add(authorEmail.toLowerCase())
    }
  } catch {
    // Ignore missing idea.
  }

  const [comments, features] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: {
        and: [{ targetType: { equals: 'idea' } }, { targetId: { equals: ideaId } }],
      },
      limit: 500,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'features',
      where: {
        idea: {
          equals: ideaId,
        },
      },
      limit: 500,
      overrideAccess: true,
    }),
  ])

  for (const comment of comments.docs) {
    if (comment.guestEmail) {
      emails.add(comment.guestEmail.toLowerCase())
    }

    const authorEmail = await resolveUserEmailByRelation(payload, comment.authorUser)
    if (authorEmail) {
      emails.add(authorEmail.toLowerCase())
    }
  }

  for (const feature of features.docs) {
    const authorEmail = await resolveUserEmailByRelation(payload, feature.author)
    if (authorEmail) {
      emails.add(authorEmail.toLowerCase())
    }
  }

  return Array.from(emails)
}

export async function queueNotifications(payload: Payload, list: QueueNotificationInput[]) {
  if (list.length === 0) {
    return
  }

  const unique = new Map<string, QueueNotificationInput>()

  for (const item of list) {
    const key = `${item.eventType}:${item.recipientEmail.toLowerCase()}:${item.targetType || ''}:${item.targetId || ''}`
    if (!unique.has(key)) {
      unique.set(key, {
        ...item,
        recipientEmail: item.recipientEmail.toLowerCase(),
      })
    }
  }

  await Promise.all(
    Array.from(unique.values()).map((item) => {
      const createArgs = {
        collection: 'notifications',
        data: {
          eventType: item.eventType,
          recipientEmail: item.recipientEmail,
          targetType: item.targetType,
          targetId: item.targetId,
          status: 'pending',
          payload: item.payload,
        },
        overrideAccess: true,
      } as unknown as Parameters<typeof payload.create>[0]
      return payload.create(createArgs)
    }),
  )
}

export async function dispatchPendingNotifications(
  payload: Payload,
  {
    resend,
    fromEmail,
  }: {
    resend: Resend | null
    fromEmail?: string | null
  },
) {
  const pendingArgs = {
    collection: 'notifications',
    where: {
      status: {
        equals: 'pending',
      },
    },
    sort: 'createdAt',
    limit: 100,
    overrideAccess: true,
  } as unknown as Parameters<typeof payload.find>[0]

  const pending = await payload.find(pendingArgs)

  let sent = 0
  let failed = 0

  for (const item of pending.docs as Array<{
    id: string | number
    eventType?: string
    recipientEmail: string
    payload?: Record<string, unknown>
    retryCount?: number
  }>) {
    try {
      const mail = buildNotificationMailContent(item)

      if (resend && fromEmail) {
        await resend.emails.send({
          from: fromEmail,
          to: item.recipientEmail,
          subject: mail.subject,
          html: mail.html,
        })
      } else {
        console.info(`[NOTIFICATION MOCK] ${item.recipientEmail} ${mail.subject}`)
      }

      const updateSuccessArgs = {
        collection: 'notifications',
        id: item.id,
        data: {
          status: 'sent',
          sentAt: new Date().toISOString(),
        },
        overrideAccess: true,
      } as unknown as Parameters<typeof payload.update>[0]

      await payload.update(updateSuccessArgs)
      sent += 1
    } catch (error) {
      const updateFailedArgs = {
        collection: 'notifications',
        id: item.id,
        data: {
          status: 'failed',
          retryCount: (item.retryCount || 0) + 1,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        },
        overrideAccess: true,
      } as unknown as Parameters<typeof payload.update>[0]

      await payload.update(updateFailedArgs)
      failed += 1
    }
  }

  return {
    queued: pending.totalDocs,
    sent,
    failed,
  }
}
