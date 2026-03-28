import type { Comment, Content, Feature, Idea } from '@/payload-types'
import { getAdminInboxSnapshot, getWeeklyOpsSnapshot } from '@/lib/data/queries'
import { getCommentDisplayName } from '@/lib/domain/comment-authors'
import { normalizeIdeaPrioritySettings } from '@/lib/domain/idea-priority'
import { getNextIdeaStatuses, type IdeaStatus } from '@/lib/domain/idea-state-machine'
import { getPayloadClient } from '@/lib/payload'

export type TriageStatusFilter = 'all' | IdeaStatus
export type TriageSort = 'priority' | 'latest'
export type ReviewQueueFilter = 'all' | 'comments' | 'features'
export type ReviewKind = 'comment' | 'feature'
export type ReviewUpdatedFilter = 'all' | '24h' | '7d' | 'stale'
export type ReviewFeatureStatusFilter = 'all' | Feature['status']
export type ReviewCommentTargetFilter = 'all' | Comment['targetType']

export type ReviewTargetSummary = {
  label: string
  adminHref?: string
  publicHref?: string
  secondary?: string
}

export type AdminActivityDoc = {
  id: string | number
  event: string
  userId?: string | null
  targetType?: string | null
  targetId?: string | null
  createdAt?: string | null
  meta?: Record<string, unknown> | null
}

export type TriagePriorityBreakdown = {
  weightedVotes: number
  weightedBusinessValue: number
  weightedEffortPenalty: number
  finalScore: number
  multiplier: number
  voteCount: number
}

export type LinkedContentSummary = Content & {
  sourceIdea?: Content['sourceIdea']
  sourceFeature?: Content['sourceFeature']
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

export function parseSearchQuery(value: string | null | undefined) {
  if (!value) {
    return ''
  }

  return value.trim().slice(0, 100)
}

export function parseReviewUpdatedFilter(value: string | null | undefined): ReviewUpdatedFilter {
  if (value === '24h' || value === '7d' || value === 'stale') {
    return value
  }

  return 'all'
}

export function parseReviewFeatureStatusFilter(
  value: string | null | undefined,
): ReviewFeatureStatusFilter {
  if (value === 'open' || value === 'planned' || value === 'done') {
    return value
  }

  return 'all'
}

export function parseReviewCommentTargetFilter(
  value: string | null | undefined,
): ReviewCommentTargetFilter {
  if (value === 'idea' || value === 'content' || value === 'feature') {
    return value
  }

  return 'all'
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

export function formatBuilderLogVersion(version?: string | null) {
  if (!version) {
    return '记录'
  }

  return /^v/i.test(version) ? version : `v${version}`
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

function matchesSearch(haystack: Array<string | null | undefined>, query: string) {
  if (!query) {
    return true
  }

  const normalized = query.toLowerCase()
  return haystack.some((item) => item?.toLowerCase().includes(normalized))
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

function isWithinUpdatedWindow(value: string | null | undefined, filter: ReviewUpdatedFilter) {
  if (filter === 'all') {
    return true
  }

  if (!value) {
    return filter === 'stale'
  }

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) {
    return filter === 'stale'
  }

  const ageMs = Date.now() - timestamp
  if (filter === '24h') {
    return ageMs <= 24 * 60 * 60 * 1000
  }

  if (filter === '7d') {
    return ageMs <= 7 * 24 * 60 * 60 * 1000
  }

  return ageMs > 7 * 24 * 60 * 60 * 1000
}

export function formatAdminEvent(event: string) {
  const labels: Record<string, string> = {
    admin_idea_updated: 'Idea 已更新',
    admin_idea_content_linked: '成果已回链',
    admin_idea_content_unlinked: '成果回链已取消',
    admin_comment_reviewed: '评论已审核',
    admin_feature_updated: '功能建议已处理',
    admin_notifications_dispatched: '通知已派发',
    admin_payload_bridge_login: 'Payload 会话已接力',
    admin_bulk_comments_reviewed: '批量评论审核',
    admin_bulk_features_updated: '批量功能处理',
  }

  return labels[event] || event
}

export function getIdeaPriorityBreakdown(idea: Pick<Idea, 'voteCount' | 'impactScore' | 'effortScore' | 'reusabilityScore' | 'priorityScore'>, settings: { priorityScoreMultiplier: number }): TriagePriorityBreakdown {
  const weightedVotes = Math.max(0, Math.round((idea.voteCount || 0) * settings.priorityScoreMultiplier))
  const weightedBusinessValue = (idea.impactScore || 0) * 4 + (idea.reusabilityScore || 0) * 2
  const weightedEffortPenalty = (idea.effortScore || 0) * 2

  return {
    weightedVotes,
    weightedBusinessValue,
    weightedEffortPenalty,
    finalScore: idea.priorityScore || Math.max(0, weightedVotes + weightedBusinessValue - weightedEffortPenalty),
    multiplier: settings.priorityScoreMultiplier,
    voteCount: idea.voteCount || 0,
  }
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
  const weeklySince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    triageIdeasResult,
    pendingCommentsResult,
    activeFeaturesResult,
    staleIdeasResult,
    shippedIdeasResult,
    adminActivityResult,
    inbox,
    weekly,
  ] =
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
      payload.find({
        collection: 'ideas',
        where: {
          and: [
            {
              or: [{ status: { equals: 'launched' } }, { status: { equals: 'reviewed' } }],
            },
            { updatedAt: { greater_than: weeklySince } },
          ],
        },
        sort: '-updatedAt',
        limit: 6,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'interactionEvents',
        where: {
          event: {
            like: 'admin_%',
          },
        },
        sort: '-createdAt',
        limit: 8,
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
    shippedIdeas: shippedIdeasResult.docs as Idea[],
    adminActivity: adminActivityResult.docs as AdminActivityDoc[],
    inbox,
    weekly,
  }
}

export async function getIdeaTriageData({
  ideaId,
  status,
  sort,
  query,
}: {
  ideaId: number | null
  status: TriageStatusFilter
  sort: TriageSort
  query: string
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

  const ideas = (ideasResult.docs as Idea[]).filter((item) =>
    matchesSearch([item.title, item.description, item.slug], query),
  )
  const selectedIdea = ideas.find((item) => item.id === ideaId) || ideas[0] || null

  if (!selectedIdea) {
    return {
      ideas,
      selectedIdea: null,
      relatedFeatures: [] as Feature[],
      relatedComments: [] as Comment[],
      nextStatuses: [] as IdeaStatus[],
      linkedContents: [] as LinkedContentSummary[],
      contentOptions: [] as LinkedContentSummary[],
      adminActivity: [] as AdminActivityDoc[],
      priorityBreakdown: null as TriagePriorityBreakdown | null,
    }
  }

  const [relatedFeaturesResult, relatedCommentsResult, allContentsResult, siteSettings, adminActivityResult] = await Promise.all([
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
      depth: 1,
    }),
    payload.find({
      collection: 'contents',
      sort: '-updatedAt',
      limit: 50,
      depth: 1,
      overrideAccess: true,
    }),
    payload.findGlobal({
      slug: 'siteSettings',
      overrideAccess: true,
    }).catch(() => null),
    payload.find({
      collection: 'interactionEvents',
      where: {
        and: [
          { event: { like: 'admin_%' } },
          { targetType: { equals: 'idea' } },
          { targetId: { equals: String(selectedIdea.id) } },
        ],
      },
      sort: '-createdAt',
      limit: 8,
      overrideAccess: true,
    }),
  ])

  const relatedFeatures = relatedFeaturesResult.docs as Feature[]
  const featureIds = new Set(relatedFeatures.map((item) => String(item.id)))
  const allContents = allContentsResult.docs as LinkedContentSummary[]
  const linkedContents = allContents.filter((item) => {
    const sourceIdeaId = relationId(item.sourceIdea)
    const sourceFeatureId = relationId(item.sourceFeature)
    return sourceIdeaId === String(selectedIdea.id) || (sourceFeatureId ? featureIds.has(sourceFeatureId) : false)
  })
  const contentOptions = allContents.filter((item) => {
    const sourceIdeaId = relationId(item.sourceIdea)
    return !sourceIdeaId || sourceIdeaId === String(selectedIdea.id)
  })
  const settings = normalizeIdeaPrioritySettings(
    siteSettings && typeof siteSettings === 'object' && 'thresholds' in siteSettings
      ? (siteSettings as { thresholds?: { hotIdeaVoteThreshold?: number; priorityScoreMultiplier?: number } }).thresholds
      : undefined,
  )

  return {
    ideas,
    selectedIdea,
    relatedFeatures,
    relatedComments: relatedCommentsResult.docs as Comment[],
    nextStatuses: getNextIdeaStatuses(selectedIdea.status),
    linkedContents,
    contentOptions,
    adminActivity: adminActivityResult.docs as AdminActivityDoc[],
    priorityBreakdown: getIdeaPriorityBreakdown(selectedIdea, settings),
  }
}

export async function getReviewQueueData({
  queue,
  kind,
  itemId,
  query,
  updated,
  featureStatus,
  commentTarget,
}: {
  queue: ReviewQueueFilter
  kind: ReviewKind | null
  itemId: number | null
  query: string
  updated: ReviewUpdatedFilter
  featureStatus: ReviewFeatureStatusFilter
  commentTarget: ReviewCommentTargetFilter
}) {
  const payload = await getPayloadClient()

  const [commentsResult, featuresResult] = await Promise.all([
    payload.find({
      collection: 'comments',
      where: {
        and: [
          {
            status: {
              equals: 'pending',
            },
          },
          ...(commentTarget !== 'all' ? [{ targetType: { equals: commentTarget } }] : []),
        ],
      },
      sort: '-createdAt',
      limit: 20,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'features',
      where: {
        or:
          featureStatus === 'all'
            ? [{ status: { equals: 'open' } }, { status: { equals: 'planned' } }]
            : [{ status: { equals: featureStatus } }],
      },
      sort: '-updatedAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  const comments = (commentsResult.docs as Comment[]).filter((comment) =>
    isWithinUpdatedWindow(comment.createdAt, updated) &&
    matchesSearch(
      [comment.content, getCommentAuthor(comment), comment.targetType, comment.reviewReason || ''],
      query,
    ),
  )
  const features = (featuresResult.docs as Feature[]).filter((feature) =>
    isWithinUpdatedWindow(feature.updatedAt, updated) &&
    matchesSearch(
      [feature.content, getFeatureIdeaTitle(feature), feature.builderReply || '', feature.status],
      query,
    ),
  )
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
  const selectedActivity =
    selectedKind === 'comment' && selectedComment
      ? await payload.find({
          collection: 'interactionEvents',
          where: {
            and: [
              { event: { like: 'admin_%' } },
              { targetType: { equals: 'comment' } },
              { targetId: { equals: String(selectedComment.id) } },
            ],
          },
          sort: '-createdAt',
          limit: 6,
          overrideAccess: true,
        })
      : selectedKind === 'feature' && selectedFeature
        ? await payload.find({
            collection: 'interactionEvents',
            where: {
              and: [
                { event: { like: 'admin_%' } },
                { targetType: { equals: 'feature' } },
                { targetId: { equals: String(selectedFeature.id) } },
              ],
            },
            sort: '-createdAt',
            limit: 6,
            overrideAccess: true,
          })
        : null

  return {
    comments: availableComments,
    features: availableFeatures,
    selectedKind,
    selectedComment,
    selectedFeature,
    selectedCommentTarget,
    selectedActivity: selectedActivity?.docs as AdminActivityDoc[] | undefined,
  }
}
