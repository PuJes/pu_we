'use server'

import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { ApiRouteError } from '@/lib/api/error'
import { getSessionFromCookies } from '@/lib/auth/session'
import { recordInteractionEvent } from '@/lib/domain/interaction-events'
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

function readBoolean(formData: FormData, key: string) {
  const value = formData.get(key)
  if (value === 'on' || value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }
  return false
}

function readIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => Number(typeof value === 'string' ? value : ''))
    .filter((value) => Number.isFinite(value))
}

function relationId(value: unknown) {
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

async function requireAdminSession() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== 'admin') {
    throw new ApiRouteError('FORBIDDEN', 'Admin role required.', 403)
  }

  return session
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

async function revalidateContentPaths(contentId: number | null) {
  if (!contentId) {
    return
  }

  const payload = await getPayloadClient()
  const content = (await payload
    .findByID({
      collection: 'contents',
      id: contentId,
      overrideAccess: true,
    })
    .catch(() => null)) as Content | null

  if (content?.slug) {
    revalidatePath(`/post/${content.slug}`)
  }
}

async function recordAdminEvent({
  event,
  userId,
  targetType,
  targetId,
  meta,
}: {
  event: string
  userId: string
  targetType?: 'idea' | 'feature' | 'comment' | 'content' | 'auth'
  targetId?: string
  meta?: Record<string, unknown>
}) {
  const payload = await getPayloadClient()
  await recordInteractionEvent({
    payload,
    event,
    userId,
    targetType,
    targetId,
    meta,
  })
}

export async function updateIdeaAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/triage')

  try {
    const session = await requireAdminSession()

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
    const impactScore = readNumber(formData, 'impactScore')
    const effortScore = readNumber(formData, 'effortScore')
    const reusabilityScore = readNumber(formData, 'reusabilityScore')
    const reviewedThankYouTemplate = readString(formData, 'reviewedThankYouTemplate')
    const builderLogVersion = readString(formData, 'builderLogVersion')
    const builderLogContent = readString(formData, 'builderLogContent')

    const data: Record<string, unknown> = {}
    const changedFields: string[] = []

    if (nextStatus && nextStatus !== idea.status) {
      if (!getNextIdeaStatuses(idea.status).includes(nextStatus)) {
        throw new Error(`不允许从 ${idea.status} 直接推进到 ${nextStatus}。`)
      }

      data.status = nextStatus
      data.statusChangeReason = statusChangeReason || '由后台分诊台推进状态。'
      changedFields.push('status')
    } else if (statusChangeReason) {
      data.statusChangeReason = statusChangeReason
      changedFields.push('statusChangeReason')
    }

    if (targetVersion !== (idea.targetVersion || '')) {
      data.targetVersion = targetVersion || null
      changedFields.push('targetVersion')
    }

    if (impactScore !== null && impactScore !== (idea.impactScore || 0)) {
      data.impactScore = impactScore
      changedFields.push('impactScore')
    }

    if (effortScore !== null && effortScore !== (idea.effortScore || 0)) {
      data.effortScore = effortScore
      changedFields.push('effortScore')
    }

    if (reusabilityScore !== null && reusabilityScore !== (idea.reusabilityScore || 0)) {
      data.reusabilityScore = reusabilityScore
      changedFields.push('reusabilityScore')
    }

    if (reviewedThankYouTemplate !== (idea.reviewedThankYouTemplate || '')) {
      data.reviewedThankYouTemplate = reviewedThankYouTemplate || null
      changedFields.push('reviewedThankYouTemplate')
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
      changedFields.push('builderLogs')
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

    await recordAdminEvent({
      event: 'admin_idea_updated',
      userId: session.userId,
      targetType: 'idea',
      targetId: String(ideaId),
      meta: {
        changedFields,
        nextStatus: data.status || idea.status,
      },
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
    const session = await requireAdminSession()

    const commentId = readNumber(formData, 'commentId')
    const status = readString(formData, 'status') as Comment['status']
    const reviewReason = readString(formData, 'reviewReason')
    const reviewReasonPublic = readBoolean(formData, 'reviewReasonPublic')

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
        reviewReasonPublic,
      },
      overrideAccess: true,
    })

    await recordAdminEvent({
      event: 'admin_comment_reviewed',
      userId: session.userId,
      targetType: 'comment',
      targetId: String(commentId),
      meta: {
        status,
        reviewReason,
        reviewReasonPublic,
        targetType: comment.targetType,
        targetId: comment.targetId,
      },
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
    const session = await requireAdminSession()

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
    const changedFields: string[] = []

    if (status !== feature.status) {
      data.status = status
      data.isAdopted = status === 'planned' || status === 'done'
      changedFields.push('status')
    }

    if (builderReply !== (feature.builderReply || '')) {
      data.builderReply = builderReply || null
      changedFields.push('builderReply')
    }

    if (statusChangeReason !== (feature.statusChangeReason || '')) {
      data.statusChangeReason = statusChangeReason || null
      changedFields.push('statusChangeReason')
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

    await recordAdminEvent({
      event: 'admin_feature_updated',
      userId: session.userId,
      targetType: 'feature',
      targetId: String(featureId),
      meta: {
        changedFields,
        status: data.status || feature.status,
        ideaId: relationId(feature.idea),
      },
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

export async function linkIdeaContentAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/triage')

  try {
    const session = await requireAdminSession()
    const ideaId = readNumber(formData, 'ideaId')
    const contentId = readNumber(formData, 'contentId')
    const contributorThanks = readString(formData, 'contributorThanks')

    if (!ideaId || !contentId) {
      throw new Error('缺少 Idea 或 Content。')
    }

    const payload = await getPayloadClient()
    const content = (await payload.findByID({
      collection: 'contents',
      id: contentId,
      overrideAccess: true,
      depth: 1,
    })) as Content

    await payload.update({
      collection: 'contents',
      id: contentId,
      data: {
        sourceIdea: ideaId,
        contributorThanks: contributorThanks || content.contributorThanks || null,
      },
      overrideAccess: true,
    })

    await recordAdminEvent({
      event: 'admin_idea_content_linked',
      userId: session.userId,
      targetType: 'idea',
      targetId: String(ideaId),
      meta: {
        contentId,
        contentTitle: content.title,
      },
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/triage')
    await revalidateIdeaPublicPaths(ideaId)
    await revalidateContentPaths(contentId)

    redirect(withNotice(returnTo, 'success', '成果内容已回链到当前 Idea。'))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '回链内容失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function unlinkIdeaContentAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/triage')

  try {
    const session = await requireAdminSession()
    const ideaId = readNumber(formData, 'ideaId')
    const contentId = readNumber(formData, 'contentId')

    if (!ideaId || !contentId) {
      throw new Error('缺少 Idea 或 Content。')
    }

    const payload = await getPayloadClient()
    const content = (await payload.findByID({
      collection: 'contents',
      id: contentId,
      overrideAccess: true,
      depth: 1,
    })) as Content

    if (relationId(content.sourceIdea) !== String(ideaId)) {
      throw new Error('这篇内容当前没有关联到这个 Idea。')
    }

    await payload.update({
      collection: 'contents',
      id: contentId,
      data: {
        sourceIdea: null,
      },
      overrideAccess: true,
    })

    await recordAdminEvent({
      event: 'admin_idea_content_unlinked',
      userId: session.userId,
      targetType: 'idea',
      targetId: String(ideaId),
      meta: {
        contentId,
        contentTitle: content.title,
      },
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/triage')
    await revalidateIdeaPublicPaths(ideaId)
    await revalidateContentPaths(contentId)

    redirect(withNotice(returnTo, 'success', '成果回链已取消。'))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '取消回链失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function bulkReviewCommentsAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/reviews')

  try {
    const session = await requireAdminSession()
    const ids = readIds(formData, 'commentIds')
    const status = readString(formData, 'status') as Comment['status']
    const reviewReason = readString(formData, 'reviewReason')
    const reviewReasonPublic = readBoolean(formData, 'reviewReasonPublic')

    if (ids.length === 0) {
      throw new Error('请先勾选至少一条评论。')
    }

    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('评论只能批量审核为 approved 或 rejected。')
    }

    const payload = await getPayloadClient()
    const comments = await Promise.all(
      ids.map((id) =>
        payload.findByID({
          collection: 'comments',
          id,
          overrideAccess: true,
        }) as Promise<Comment>,
      ),
    )

    await Promise.all(
      comments.map((comment) =>
        payload.update({
          collection: 'comments',
          id: comment.id,
          data: {
            status,
            reviewReason: reviewReason || null,
            reviewReasonPublic,
          },
          overrideAccess: true,
        }),
      ),
    )

    await Promise.all(comments.map((comment) => revalidateCommentTargetPaths(comment)))
    await recordAdminEvent({
      event: 'admin_bulk_comments_reviewed',
      userId: session.userId,
      targetType: 'comment',
      meta: {
        count: ids.length,
        status,
        reviewReasonPublic,
      },
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/reviews')

    redirect(withNotice(returnTo, 'success', `已批量处理 ${ids.length} 条评论。`))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '批量处理评论失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function bulkUpdateFeaturesAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard/reviews')

  try {
    const session = await requireAdminSession()
    const ids = readIds(formData, 'featureIds')
    const status = readString(formData, 'status') as Feature['status']
    const builderReply = readString(formData, 'builderReply')
    const statusChangeReason = readString(formData, 'statusChangeReason')

    if (ids.length === 0) {
      throw new Error('请先勾选至少一条功能建议。')
    }

    if (!['open', 'planned', 'done'].includes(status)) {
      throw new Error('功能建议状态不合法。')
    }

    const payload = await getPayloadClient()
    const features = await Promise.all(
      ids.map((id) =>
        payload.findByID({
          collection: 'features',
          id,
          depth: 1,
          overrideAccess: true,
        }) as Promise<Feature>,
      ),
    )

    await Promise.all(
      features.map((feature) =>
        payload.update({
          collection: 'features',
          id: feature.id,
          data: {
            status,
            isAdopted: status === 'planned' || status === 'done',
            builderReply: builderReply || feature.builderReply || null,
            statusChangeReason: statusChangeReason || feature.statusChangeReason || null,
          },
          overrideAccess: true,
        }),
      ),
    )

    await Promise.all(
      features.map((feature) =>
        feature.idea && typeof feature.idea === 'object'
          ? revalidateIdeaPublicPaths(feature.idea.id)
          : Promise.resolve(revalidatePath('/lab')),
      ),
    )

    await recordAdminEvent({
      event: 'admin_bulk_features_updated',
      userId: session.userId,
      targetType: 'feature',
      meta: {
        count: ids.length,
        status,
      },
    })

    revalidatePath('/admin-dashboard')
    revalidatePath('/admin-dashboard/reviews')

    redirect(withNotice(returnTo, 'success', `已批量处理 ${ids.length} 条功能建议。`))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '批量处理功能建议失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}

export async function dispatchPendingNotificationsAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readString(formData, 'returnTo'), '/admin-dashboard')

  try {
    const session = await requireAdminSession()

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

    await recordAdminEvent({
      event: 'admin_notifications_dispatched',
      userId: session.userId,
      targetType: 'auth',
      meta: result,
    })

    redirect(withNotice(returnTo, tone, message))
  } catch (error) {
    if (isRedirectLikeError(error)) {
      throw error
    }

    const message = error instanceof Error ? error.message : '通知派发失败。'
    redirect(withNotice(returnTo, 'error', message))
  }
}
