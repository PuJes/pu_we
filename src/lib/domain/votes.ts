import type { Payload } from 'payload'

export type VoteTargetType = 'idea' | 'feature'

export async function registerVote({
  payload,
  targetType,
  targetId,
  userIdentifier,
  userId,
}: {
  payload: Payload
  targetType: VoteTargetType
  targetId: string
  userIdentifier: string
  userId?: string
}) {
  const existing = await payload.find({
    collection: 'votes',
    where: {
      and: [
        { targetType: { equals: targetType } },
        { targetId: { equals: targetId } },
        { userIdentifier: { equals: userIdentifier } },
      ],
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    return { duplicated: true }
  }

  await payload.create({
    collection: 'votes',
    data: {
      targetType,
      targetId,
      userIdentifier,
      userId,
    },
  })

  if (targetType === 'idea') {
    const idea = await payload.findByID({
      collection: 'ideas',
      id: targetId,
    })

    await payload.update({
      collection: 'ideas',
      id: targetId,
      data: {
        voteCount: (idea.voteCount ?? 0) + 1,
      },
    })
  }

  if (targetType === 'feature') {
    const feature = await payload.findByID({
      collection: 'features',
      id: targetId,
    })

    await payload.update({
      collection: 'features',
      id: targetId,
      data: {
        voteCount: (feature.voteCount ?? 0) + 1,
      },
    })
  }

  return { duplicated: false }
}
