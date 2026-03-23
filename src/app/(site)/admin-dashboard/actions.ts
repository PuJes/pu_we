'use server'

import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ApiRouteError } from '@/lib/api/error'
import { getSessionFromCookies } from '@/lib/auth/session'
import { getNextIdeaStatuses, type IdeaStatus } from '@/lib/domain/idea-state-machine'
import { dispatchPendingNotifications } from '@/lib/domain/notifications'
import { getEnv } from '@/lib/env'
import { getPayloadClient } from '@/lib/payload'
import type { Comment, Content, Feature, Idea } from '@/payload-types'

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function readNumber(formData: FormData, key: string) {
  const parsed = Number(readString(formData, key))
  return Number.isFinite(parsed) ? parsed : null
}

async function requireAdminSession() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== 'admin') {
    throw new ApiRouteError('FORBIDDEN', 'Admin role required.', 403)
  }
}

function sanitizeReturnTo(value: string, fallback: string) {
  if (!value.startsWith('/admin-dashboard')) {
    return fallback
  }

  return value
}

function isRedirectLikeError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  )
}

function withNotice(path: string, tone: 'success' | 'error', message: string) {
  const url = new URL(path, 'http://localhost')
  url.searchParams.set('tone', tone)
  url.searchParams.set('notice', message)

  return `${url.pathname}${url.search}`
}

async function revalidateIdeaPublicPaths(ideaId: number | null) {
  if (!ideaId) {
    revalidatePath('/lab')
    return
  }

  const payload = await getPayloadClient()
  const idea = (await payload
    .findByID({
      collection: 'ideas',
      id: ideaId,
      overrideAccess: true,
    })
    .catch(() => null)) as Idea | null

  revalidatePath('/lab')

  if (idea?.slug) {
    revalidatePath(`/lab/idea/${idea.slug}`)
  }
}

async function revalidateCommentTargetPaths(comment: Comment) {
  const targetId = Number(comment.targetId)
  if (!Number.isFinite(targetId)) {
    return
  }

  const payload = await getPayloadClient()

  if (comment.targetType === 'idea') {
    await revalidateIdeaPublicPaths(targetId)
    return
  }

  if (comment.targetType === 'content') {
    const content = (await payload
      .findByID({
        collection: 'contents',
        id: targetId,
        overrideAccess: true,
      })
      .catch(() => null)) as Content | null

    if (content?.slug) {
      revalidatePath(`/post/${content.slug}`)
    }
    return
  }

  const feature = (await payload
    .findByID({
      collection: 'features',
      id: targetId,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)) as Feature | null

  if (feature?.idea && typeof feature.idea === 'object') {
    await revalidateIdeaPublicPaths(feature.idea.id)
  }
}

export async function updateIdeaAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/triage')

  try {
    await requireAdminSession()

    const ideaId = readNumber(formData, 'ideaId')
    if (!ideaId) {
      throw new Error('缺少 Idea ID。')
    }

    const payload = await getPayloadClient()
    const idea = (await payload.findByID({
      collection: 'ideas',
      id: ideaId,
      overrideAccess: true,
    })) as Idea

    const nextStatus = readString(formData, 'nextStatus') as IdeaStatus | ''
    const targetVersion = readString(formData, 'targetVersion')
    const statusChangeReason = readString(formData, 'statusChangeReason')
    const builderLogVersion = readString(formData, 'builderLogVersion')
    const builderLogContent = readString(formData, 'builderLogContent')

    const data: Record<string, unknown> = {}

    if (nextStatus && nextStatus !== idea.status) {
      if (!getNextIdeaStatuses(idea.status).includes(nextStatus)) {
        throw new Error(`不允许从 ${idea.status} 直接推进到 ${nextStatus}。`)
      }

      data.status = nextStatus
      data.statusChangeReason = statusChangeReason || '由后台分诊台推进状态。'
    } else if (statusChangeReason) {
      data.statusChangeReason = statusChangeReason
    }

    if (targetVersion !== (idea.targetVersion || '')) {
      data.targetVersion = targetVersion || null
    }

    if (builderLogContent) {
      data.builderLogs = [
        ...(idea.builderLogs || []),
        {
          date: new Date().toISOString(),
          version: builderLogVersion || undefined,
          content: builderLogContent,
        },
      ]
    }

    if (Object.keys(data).length === 0) {
      redirect(withNotice(returnTo, 'error', '没有检测到可保存的改动。'))
    }

    await payload.update({
      collection: 'ideas',
      id: ideaId,
      data,
      overrideAccess: true,
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/triage')
    await revalidateIdeaPublicPaths(ideaId)

    redirect(withNotice(returnTo, 'success', 'Idea 已更新。'))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '保存 Idea 失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function reviewCommentAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/reviews')

  try {
    await requireAdminSession()

    const commentId = readNumber(formData, 'commentId')
    const status = readString(formData, 'status') as Comment['status']
    const reviewReason = readString(formData, 'reviewReason')

    if (!commentId) {
      throw new Error('缺少评论 ID。')
    }

    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('评论只能审核为 approved 或 rejected。')
    }

    const payload = await getPayloadClient()
    const comment = (await payload.findByID({
      collection: 'comments',
      id: commentId,
      overrideAccess: true,
    })) as Comment

    await payload.update({
      collection: 'comments',
      id: commentId,
      data: {
        status,
        reviewReason: reviewReason || null,
      },
      overrideAccess: true,
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/reviews')
    await revalidateCommentTargetPaths(comment)

    redirect(withNotice(returnTo, 'success', status === 'approved' ? '评论已通过。' : '评论已驳回。'))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '评论审核失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function updateFeatureAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/reviews')

  try {
    await requireAdminSession()

    const featureId = readNumber(formData, 'featureId')
    const status = readString(formData, 'status') as Feature['status']
    const builderReply = readString(formData, 'builderReply')
    const statusChangeReason = readString(formData, 'statusChangeReason')

    if (!featureId) {
      throw new Error('缺少功能建议 ID。')
    }

    if (!['open', 'planned', 'done'].includes(status)) {
      throw new Error('功能建议状态不合法。')
    }

    const payload = await getPayloadClient()
    const feature = (await payload.findByID({
      collection: 'features',
      id: featureId,
      depth: 1,
      overrideAccess: true,
    })) as Feature

    const data: Record<string, unknown> = {}

    if (status !== feature.status) {
      data.status = status
      data.isAdopted = status === 'planned' || status === 'done'
    }

    if (builderReply && builderReply !== (feature.builderReply || '')) {
      data.builderReply = builderReply
    }

    if (statusChangeReason) {
      data.statusChangeReason = statusChangeReason
    }

    if (Object.keys(data).length === 0) {
      redirect(withNotice(returnTo, 'error', '没有检测到可保存的改动。'))
    }

    await payload.update({
      collection: 'features',
      id: featureId,
      data,
      overrideAccess: true,
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/reviews')

    if (feature.idea && typeof feature.idea === 'object') {
      await revalidateIdeaPublicPaths(feature.idea.id)
    } else {
      revalidatePath('/lab')
    }

    redirect(withNotice(returnTo, 'success', '功能建议已更新。'))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '功能建议更新失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function dispatchPendingNotificationsAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard')

  try {
    await requireAdminSession()

    const payload = await getPayloadClient()
    const env = getEnv()
    const resend =
      env.RESEND_API_KEY && env.RESEND_FROM_EMAIL ? new Resend(env.RESEND_API_KEY) : null

    const result = await dispatchPendingNotifications(payload, {
      resend,
      fromEmail: env.RESEND_FROM_EMAIL || null,
    })

    revalidatePath('/admin-dashboard')

    const tone = result.failed > 0 ? 'error' : 'success'
    const message =
      result.queued === 0
        ? '当前没有待派发通知。'
        : `通知派发完成：${result.sent} 条成功，${result.failed} 条失败。`

    redirect(withNotice(returnTo, tone, message))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '通知派发失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}
