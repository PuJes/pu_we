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
  builderLogs?: Array<{ date: string; version?: string; content: string }>
}

export type ContentDoc = {
  id: string
  title: string
  slug: string
  category: string
  type: string
  snippet?: string
  articleBody?: string
  keyArgument?: string
  analysisFramework?: string
  takeaways?: Array<{ item: string }>
  tags?: Array<{ tag: string }>
  publishedAt?: string
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
    return fallbackIdeas
  }
})

export const getIdeaDetail = cache(async (slug: string) => {
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
      }),
    ])

    return {
      idea: idea as unknown as IdeaDoc,
      features: features.docs,
      comments: comments.docs,
    }
  } catch {
    return {
      idea: fallbackIdeas[0],
      features: [],
      comments: [],
    }
  }
})

export const getContentsByCategory = cache(async (category: string) => {
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
    return fallbackContents.filter((item) => item.category === category)
  }
})

export const getContentBySlug = cache(async (slug: string) => {
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
    return fallbackContents.find((item) => item.slug === slug) || null
  }
})

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
