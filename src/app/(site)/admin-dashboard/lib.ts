import type { Comment, Content, Feature, Idea } from '@/payload-types'
import { getAdminInboxSnapshot, getWeeklyOpsSnapshot } from '@/lib/data/queries'
import { getCommentDisplayName } from '@/lib/domain/comment-authors'
import { getNextIdeaStatuses, type IdeaStatus } from '@/lib/domain/idea-state-machine'
import { getPayloadClient } from '@/lib/payload'

export type TriageStatusFilter = 'all' | IdeaStatus
export type TriageSort = 'priority' | 'latest'
export type ReviewQueueFilter = 'all' | 'comments' | 'features'
export type ReviewKind = 'comment' | 'feature'

export type ReviewTargetSummary = {
  label: string
  adminHref?: string
  publicHref?: string
  secondary?: string
}

function getIdNumber(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseTriageStatusFilter(value: string | null | undefined): TriageStatusFilter {
  const allowed: TriageStatusFilter[] = [
    'all',
    'pending',
    'discussing',
    'approved',
    'in-progress',
    'launched',
    'reviewed',
  ]

  return allowed.includes(value as TriageStatusFilter) ? (value as TriageStatusFilter) : 'all'
}

export function parseTriageSort(value: string | null | undefined): TriageSort {
  return value === 'latest' ? 'latest' : 'priority'
}

export function parseReviewQueueFilter(value: string | null | undefined): ReviewQueueFilter {
  return value === 'comments' || value === 'features' ? value : 'all'
}

export function parseReviewKind(value: string | null | undefined): ReviewKind | null {
  if (value === 'comment' || value === 'feature') {
    return value
  }

  return null
}

export function parseSelectedId(value: string | null | undefined) {
  return getIdNumber(value)
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return '待补时间'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '待补时间'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

export function formatIdeaStatus(status: IdeaStatus) {
  const labels: Record<IdeaStatus, string> = {
    pending: '待筛选',
    discussing: '讨论中',
    approved: '已立项',
    'in-progress': '开发中',
    launched: '已上线',
    reviewed: '已复盘',
  }

  return labels[status]
}

export function formatFeatureStatus(status: Feature['status']) {
  const labels: Record<Feature['status'], string> = {
    open: '开放建议',
    planned: '已采纳',
    done: '已完成',
  }

  return labels[status]
}

export function formatCommentStatus(status: Comment['status']) {
  const labels: Record<Comment['status'], string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
  }

  return labels[status]
}

export function getIdeaPriorityLabel(idea: Idea) {
  if (idea.status === 'discussing' || (idea.priorityScore || 0) >= 75) {
    return '立即处理'
  }

  if ((idea.priorityScore || 0) >= 45 || idea.voteCount >= 10) {
    return '本周评估'
  }

  return '放入观察'
}

export function getCommentAuthor(comment: Comment) {
  return getCommentDisplayName(comment, '已验证用户')
}

export function getFeatureIdea(feature: Feature) {
  return feature.idea && typeof feature.idea === 'object' ? feature.idea : null
}

export function getFeatureIdeaTitle(feature: Feature) {
  const idea = getFeatureIdea(feature)
  if (idea) {
    return idea.title
  }

  return `Idea #${feature.idea}`
}

export function getFeatureIdeaAdminHref(feature: Feature) {
  const idea = getFeatureIdea(feature)
  if (!idea) {
    return undefined
  }

  return `/admin-dashboard/triage?ideaId=${idea.id}`
}

export function getFeatureIdeaPublicHref(feature: Feature) {
  const idea = getFeatureIdea(feature)
  if (!idea) {
    return undefined
  }

  return `/lab/idea/${idea.slug}`
}

async function resolveCommentTargetSummary(comment: Comment): Promise<ReviewTargetSummary> {
  const payload = await getPayloadClient()
  const targetId = getIdNumber(comment.targetId)

  if (!targetId) {
    return {
      label: `${comment.targetType.toUpperCase()} #${comment.targetId}`,
    }
  }

  if (comment.targetType === 'idea') {
    const idea = (await payload.findByID({
      collection: 'ideas',
      id: targetId,
      overrideAccess: true,
    }).catch(() => null)) as Idea | null

    if (!idea) {
      return { label: `Idea #${targetId}` }
    }

    return {
      label: idea.title,
      adminHref: `/admin-dashboard/triage?ideaId=${idea.id}`,
      publicHref: `/lab/idea/${idea.slug}`,
      secondary: formatIdeaStatus(idea.status),
    }
  }

  if (comment.targetType === 'content') {
    const content = (await payload.findByID({
      collection: 'contents',
      id: targetId,
      overrideAccess: true,
    }).catch(() => null)) as Content | null

    if (!content) {
      return { label: `Content #${targetId}` }
    }

    return {
      label: content.title,
      publicHref: `/post/${content.slug}`,
      secondary: '内容页评论',
    }
  }

  const feature = (await payload.findByID({
    collection: 'features',
    id: targetId,
    depth: 1,
    overrideAccess: true,
  }).catch(() => null)) as Feature | null

  if (!feature) {
    return { label: `Feature #${targetId}` }
  }

  return {
    label: getFeatureIdeaTitle(feature),
    adminHref: `/admin-dashboard/reviews?kind=feature&itemId=${feature.id}`,
    publicHref: getFeatureIdeaPublicHref(feature),
    secondary: '功能建议评论',
  }
}

export async function getAdminOverviewData() {
  const payload = await getPayloadClient()
  const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [triageIdeasResult, pendingCommentsResult, activeFeaturesResult, staleIdeasResult, inbox, weekly] =
    await Promise.all([
      payload.find({
        collection: 'ideas',
        where: {
          or: [
            { status: { equals: 'pending' } },
            { status: { equals: 'discussing' } },
            { status: { equals: 'approved' } },
            { status: { equals: 'in-progress' } },
          ],
        },
        sort: '-priorityScore',
        limit: 8,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'comments',
        where: {
          status: {
            equals: 'pending',
          },
        },
        sort: '-createdAt',
        limit: 6,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'features',
        where: {
          or: [{ status: { equals: 'open' } }, { status: { equals: 'planned' } }],
        },
        sort: '-updatedAt',
        limit: 6,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'ideas',
        where: {
          and: [
            { status: { equals: 'in-progress' } },
            { updatedAt: { less_than: staleBefore } },
          ],
        },
        sort: 'updatedAt',
        limit: 6,
        overrideAccess: true,
      }),
      getAdminInboxSnapshot(),
      getWeeklyOpsSnapshot(),
    ])

  return {
    triageIdeas: triageIdeasResult.docs as Idea[],
    pendingComments: pendingCommentsResult.docs as Comment[],
    activeFeatures: activeFeaturesResult.docs as Feature[],
    staleIdeas: staleIdeasResult.docs as Idea[],
    inbox,
    weekly,
  }
}

export async function getIdeaTriageData({
  ideaId,
  status,
  sort,
}: {
  ideaId: number | null
  status: TriageStatusFilter
  sort: TriageSort
}) {
  const payload = await getPayloadClient()

  const ideasResult = await payload.find({
    collection: 'ideas',
    where:
      status === 'all'
        ? undefined
        : {
            status: {
              equals: status,
            },
          },
    sort: sort === 'latest' ? '-createdAt' : '-priorityScore',
    limit: 40,
    overrideAccess: true,
  })

  const ideas = ideasResult.docs as Idea[]
  const selectedIdea = ideas.find((item) => item.id === ideaId) || ideas[0] || null

  if (!selectedIdea) {
    return {
      ideas,
      selectedIdea: null,
      relatedFeatures: [] as Feature[],
      relatedComments: [] as Comment[],
      nextStatuses: [] as IdeaStatus[],
    }
  }

  const [relatedFeaturesResult, relatedCommentsResult] = await Promise.all([
    payload.find({
      collection: 'features',
      where: {
        idea: {
          equals: selectedIdea.id,
        },
      },
      sort: '-voteCount',
      limit: 8,
      depth: 1,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'comments',
      where: {
        and: [
          { targetType: { equals: 'idea' } },
          { targetId: { equals: String(selectedIdea.id) } },
        ],
      },
      sort: '-createdAt',
      limit: 8,
      overrideAccess: true,
    }),
  ])

  return {
    ideas,
    selectedIdea,
    relatedFeatures: relatedFeaturesResult.docs as Feature[],
    relatedComments: relatedCommentsResult.docs as Comment[],
    nextStatuses: getNextIdeaStatuses(selectedIdea.status),
  }
}

export async function getReviewQueueData({
  queue,
  kind,
  itemId,
}: {
  queue: ReviewQueueFilter
  kind: ReviewKind | null
  itemId: number | null
}) {
  const payload = await getPayloadClient()

  const [commentsResult, featuresResult] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: {
        status: {
          equals: 'pending',
        },
      },
      sort: '-createdAt',
      limit: 20,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'features',
      where: {
        or: [{ status: { equals: 'open' } }, { status: { equals: 'planned' } }],
      },
      sort: '-updatedAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const comments = commentsResult.docs as Comment[]
  const features = featuresResult.docs as Feature[]
  const availableComments = queue === 'features' ? [] : comments
  const availableFeatures = queue === 'comments' ? [] : features

  let selectedKind: ReviewKind | null = null
  let selectedComment: Comment | null = null
  let selectedFeature: Feature | null = null

  if (kind === 'comment' && itemId) {
    selectedComment = availableComments.find((item) => item.id === itemId) || null
    selectedKind = selectedComment ? 'comment' : null
  }

  if (!selectedKind && kind === 'feature' && itemId) {
    selectedFeature = availableFeatures.find((item) => item.id === itemId) || null
    selectedKind = selectedFeature ? 'feature' : null
  }

  if (!selectedKind && availableComments.length > 0) {
    selectedKind = 'comment'
    selectedComment = availableComments[0]
  } else if (!selectedKind && availableFeatures.length > 0) {
    selectedKind = 'feature'
    selectedFeature = availableFeatures[0]
  }

  const selectedCommentTarget =
    selectedKind === 'comment' && selectedComment ? await resolveCommentTargetSummary(selectedComment) : null

  return {
    comments: availableComments,
    features: availableFeatures,
    selectedKind,
    selectedComment,
    selectedFeature,
    selectedCommentTarget,
  }
}
