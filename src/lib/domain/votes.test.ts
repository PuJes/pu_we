import { describe, expect, it } from 'vitest'

import { registerVote } from '@/lib/domain/votes'

type VoteRecord = {
  targetType: 'idea' | 'feature'
  targetId: string
  userIdentifier: string
  userId?: string
}

type IdeaRecord = {
  id: string
  voteCount: number
}

function buildPayloadMock() {
  const votes: VoteRecord[] = []
  const ideas: Record<string, IdeaRecord> = {
    'idea-1': { id: 'idea-1', voteCount: 3 },
  }

  return {
    payload: {
      find: async ({
        collection,
        where,
      }: {
        collection: string
        where: {
          and: Array<{
            targetType?: { equals: 'idea' | 'feature' }
            targetId?: { equals: string }
            userIdentifier?: { equals: string }
          }>
        }
      }) => {
        if (collection === 'votes') {
          const filters = where.and
          const targetType = filters[0].targetType?.equals
          const targetId = filters[1].targetId?.equals
          const userIdentifier = filters[2].userIdentifier?.equals
          const existing = votes.filter(
            (vote) =>
              vote.targetType === targetType &&
              vote.targetId === targetId &&
              vote.userIdentifier === userIdentifier,
          )

          return { docs: existing, totalDocs: existing.length }
        }

        return { docs: [], totalDocs: 0 }
      },
      create: async ({ data }: { data: VoteRecord }) => {
        votes.push(data)
        return data
      },
      findByID: async ({ id }: { id: string }) => ideas[id],
      update: async ({ id, data }: { id: string; data: Partial<IdeaRecord> }) => {
        ideas[id] = { ...ideas[id], ...data }
        return ideas[id]
      },
    } as unknown as Parameters<typeof registerVote>[0]['payload'],
    ideas,
    votes,
  }
}

describe('registerVote', () => {
  it('writes vote and increments counter', async () => {
    const { payload, ideas, votes } = buildPayloadMock()

    const result = await registerVote({
      payload,
      targetType: 'idea',
      targetId: 'idea-1',
      userIdentifier: 'user:42',
      userId: '42',
    })

    expect(result.duplicated).toBe(false)
    expect(votes).toHaveLength(1)
    expect(ideas['idea-1'].voteCount).toBe(4)
  })

  it('returns duplicate when same identifier votes twice', async () => {
    const { payload } = buildPayloadMock()

    await registerVote({
      payload,
      targetType: 'idea',
      targetId: 'idea-1',
      userIdentifier: 'user:42',
      userId: '42',
    })

    const second = await registerVote({
      payload,
      targetType: 'idea',
      targetId: 'idea-1',
      userIdentifier: 'user:42',
      userId: '42',
    })

    expect(second.duplicated).toBe(true)
  })
})
