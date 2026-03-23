import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'
import { fallbackContents, fallbackIdeas, fallbackSponsors } from '@/lib/data/fallback'

export type IdeaDoc = {
  id: string
  title: string
  slug: string
  description: string
  status: string
  voteCount: number
  priorityScore: number
  targetVersion?: string
  statusChangeReason?: string
  statusChangedAt?: string
  statusChangedBy?: string
  statusHistory?: Array<{
    fromStatus: string
    toStatus: string
    changedAt: string
    changedBy: string
    reason?: string
  }>
  builderLogs?: Array<{ date: string; version?: string; content: string }>
  lastBuilderUpdateAt?: string
  reviewedThankYouTemplate?: string
}

export type PublicUserDoc = {
  id: string | number
  nickname?: string | null
  email?: string | null
}

export type PublicFeatureDoc = {
  id: string | number
  content: string
  status?: string
  isAdopted?: boolean | null
  voteCount?: number | null
  builderReply?: string | null
  author?: number | PublicUserDoc | null
}

export type ContentDoc = {
  id: string
  title: string
  slug: string
  category: string
  type: string
  snippet?: string
  articleBody?: string
  body?: { root?: { children?: Array<Record<string, unknown>> } }
  keyArgument?: string
  analysisFramework?: string
  takeaways?: Array<{ item: string }>
  tags?: Array<{ tag: string }>
  publishedAt?: string
  sourceIdea?: string | { id: string; slug?: string; title?: string }
  sourceFeature?: string | { id: string; content?: string }
  contributorThanks?: string
  externalLink?: string
}

export type IdeaDetailDoc = {
  idea: IdeaDoc
  features: PublicFeatureDoc[]
  comments: CommentDoc[]
  linkedContents: ContentDoc[]
}

export const getHomeSnapshot = cache(async () => {
  try {
    const payload = await getPayloadClient()

    const [ideas, recentContents, aiCount, analysisCount, storyCount] = await Promise.all([
      payload.find({
        collection: 'ideas',
        limit: 6,
        sort: '-priorityScore',
        overrideAccess: true,
      }),
      payload.find({
        collection: 'contents',
        where: {
          status: {
            equals: 'published',
          },
        },
        limit: 6,
        sort: '-publishedAt',
        overrideAccess: true,
      }),
      payload.count({
        collection: 'contents',
        where: {
          and: [
            { category: { equals: 'ai-experiments' } },
            { status: { equals: 'published' } },
          ],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'contents',
        where: {
          and: [
            { category: { equals: 'business-analysis' } },
            { status: { equals: 'published' } },
          ],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'contents',
        where: {
          and: [{ category: { equals: 'my-story' } }, { status: { equals: 'published' } }],
        },
        overrideAccess: true,
      }),
    ])

    return {
      ideas: ideas.docs as unknown as IdeaDoc[],
      recentContents: recentContents.docs as unknown as ContentDoc[],
      counters: {
        ideas: ideas.totalDocs,
        ai: aiCount.totalDocs,
        analysis: analysisCount.totalDocs,
        story: storyCount.totalDocs,
      },
    }
  } catch {
    return {
      ideas: fallbackIdeas,
      recentContents: fallbackContents,
      counters: {
        ideas: fallbackIdeas.length,
        ai: fallbackContents.filter((item) => item.category === 'ai-experiments').length,
        analysis: fallbackContents.filter((item) => item.category === 'business-analysis').length,
        story: fallbackContents.filter((item) => item.category === 'my-story').length,
      },
    }
  }
})

export const getIdeas = cache(async ({
  sort = 'hot',
  status,
}: {
  sort?: 'hot' | 'latest'
  status?: string
} = {}) => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'ideas',
      where: status
        ? {
          status: {
            equals: status,
          },
        }
        : undefined,
      sort: sort === 'hot' ? '-priorityScore' : '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return result.docs as unknown as IdeaDoc[]
  } catch {
    return fallbackIdeas as IdeaDoc[]
  }
})

export const getIdeaDetail = cache(async (slug: string): Promise<IdeaDetailDoc | null> => {
  try {
    const payload = await getPayloadClient()

    const ideaResult = await payload.find({
      collection: 'ideas',
      where: {
        slug: {
          equals: slug,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    const idea = ideaResult.docs[0]
    if (!idea) {
      return null
    }

    const [features, comments] = await Promise.all([
      payload.find({
        collection: 'features',
        where: {
          idea: {
            equals: idea.id,
          },
        },
        sort: '-voteCount',
        overrideAccess: true,
        limit: 100,
        depth: 1,
      }),
      payload.find({
        collection: 'comments',
        where: {
          and: [
            { targetType: { equals: 'idea' } },
            { targetId: { equals: String(idea.id) } },
            { status: { equals: 'approved' } },
          ],
        },
        sort: '-createdAt',
        overrideAccess: true,
        limit: 100,
        depth: 1,
      }),
    ])
    const featureIds = features.docs
      .map((item) => {
        if (!item || typeof item !== 'object' || !('id' in item)) {
          return null
        }

        const id = (item as { id?: string | number }).id
        return typeof id === 'string' || typeof id === 'number' ? String(id) : null
      })
      .filter((value): value is string => Boolean(value))
    const [linkedByIdea, linkedByFeature] = await Promise.all([
      payload.find({
        collection: 'contents',
        where: {
          and: [
            { sourceIdea: { equals: idea.id } },
            { status: { equals: 'published' } },
          ],
        },
        sort: '-publishedAt',
        overrideAccess: true,
        limit: 20,
      }),
      featureIds.length > 0
        ? payload.find({
            collection: 'contents',
            where: {
              and: [
                { sourceFeature: { in: featureIds } },
                { status: { equals: 'published' } },
              ],
            },
            sort: '-publishedAt',
            overrideAccess: true,
            limit: 20,
          })
        : Promise.resolve({ docs: [] }),
    ])
    const linkedContentMap = new Map<string, ContentDoc>()

    for (const item of [...linkedByIdea.docs, ...linkedByFeature.docs]) {
      if (!item || typeof item !== 'object' || !('id' in item)) {
        continue
      }

      const id = (item as { id?: string | number }).id
      if (typeof id !== 'string' && typeof id !== 'number') {
        continue
      }

      linkedContentMap.set(String(id), item as unknown as ContentDoc)
    }

    return {
      idea: idea as unknown as IdeaDoc,
      features: features.docs as unknown as PublicFeatureDoc[],
      comments: comments.docs as unknown as CommentDoc[],
      linkedContents: Array.from(linkedContentMap.values()),
    }
  } catch {
    return null
  }
})

export const getContentsByCategory = cache(async (category: string): Promise<ContentDoc[]> => {
  try {
    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'contents',
      where: {
        and: [{ category: { equals: category } }, { status: { equals: 'published' } }],
      },
      sort: '-publishedAt',
      limit: 100,
      overrideAccess: true,
    })

    return result.docs as unknown as ContentDoc[]
  } catch {
    return fallbackContents.filter((item) => item.category === category) as ContentDoc[]
  }
})

export const getContentBySlug = cache(async (slug: string): Promise<ContentDoc | null> => {
  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'contents',
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
      },
      limit: 1,
      overrideAccess: true,
    })

    return (result.docs[0] as unknown as ContentDoc) || null
  } catch {
    return (fallbackContents.find((item) => item.slug === slug) as ContentDoc | undefined) || null
  }
})

export type CommentDoc = {
  id: string | number
  guestName?: string | null
  authorUser?: number | PublicUserDoc | null
  content: string
  createdAt?: string
}

export const getCommentsByTarget = cache(
  async (targetType: string, targetId: string): Promise<CommentDoc[]> => {
    try {
      const payload = await getPayloadClient()
      const result = await payload.find({
        collection: 'comments',
        where: {
          and: [
            { targetType: { equals: targetType } },
            { targetId: { equals: targetId } },
            { status: { equals: 'approved' } },
          ],
        },
        sort: '-createdAt',
        limit: 50,
        overrideAccess: true,
        depth: 1,
      })
      return result.docs as unknown as CommentDoc[]
    } catch {
      return []
    }
  },
)

export const getPublicSponsors = cache(async () => {
  try {
    const payload = await getPayloadClient()

    const result = await payload.find({
      collection: 'sponsors',
      where: {
        isPublic: {
          equals: true,
        },
      },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return result.docs
  } catch {
    return fallbackSponsors
  }
})

export const getAdminInboxSnapshot = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const staleBefore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [pendingIdeas, pendingComments, openFeatures, staleInProgressIdeas] = await Promise.all([
      payload.count({
        collection: 'ideas',
        where: {
          or: [{ status: { equals: 'pending' } }, { status: { equals: 'discussing' } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'comments',
        where: {
          status: {
            equals: 'pending',
          },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'features',
        where: {
          status: {
            equals: 'open',
          },
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'ideas',
        where: {
          and: [
            { status: { equals: 'in-progress' } },
            { updatedAt: { less_than: staleBefore } },
          ],
        },
        overrideAccess: true,
      }),
    ])

    return {
      staleBefore,
      pendingIdeas: pendingIdeas.totalDocs,
      pendingComments: pendingComments.totalDocs,
      openFeatures: openFeatures.totalDocs,
      staleInProgressIdeas: staleInProgressIdeas.totalDocs,
    }
  } catch {
    return {
      staleBefore: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      pendingIdeas: 0,
      pendingComments: 0,
      openFeatures: 0,
      staleInProgressIdeas: 0,
    }
  }
})

export const getWeeklyOpsSnapshot = cache(async () => {
  try {
    const payload = await getPayloadClient()
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [votes, comments, features, ideas, reviewed] = await Promise.all([
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'idea_vote_success' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'comment_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'feature_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'interactionEvents',
        where: {
          and: [{ event: { equals: 'idea_submitted' } }, { createdAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'ideas',
        where: {
          and: [{ status: { equals: 'reviewed' } }, { updatedAt: { greater_than: since } }],
        },
        overrideAccess: true,
      }),
    ])

    return {
      since,
      funnel: {
        votes: votes.totalDocs,
        comments: comments.totalDocs,
        features: features.totalDocs,
        reviewed: reviewed.totalDocs,
      },
      weeklyActivities: {
        ideas: ideas.totalDocs,
        comments: comments.totalDocs,
        features: features.totalDocs,
      },
    }
  } catch {
    return {
      since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      funnel: {
        votes: 0,
        comments: 0,
        features: 0,
        reviewed: 0,
      },
      weeklyActivities: {
        ideas: 0,
        comments: 0,
        features: 0,
      },
    }
  }
})
