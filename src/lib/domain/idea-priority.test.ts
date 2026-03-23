import { describe, expect, it } from 'vitest'

import {
  calculateIdeaPriorityScore,
  getIdeaAutoPromotionReason,
  normalizeIdeaPrioritySettings,
  shouldAutoPromoteIdea,
} from '@/lib/domain/idea-priority'

describe('idea priority rules', () => {
  it('combines votes, impact, reusability, and effort into priority score', () => {
    const score = calculateIdeaPriorityScore(
      {
        voteCount: 42,
        impactScore: 9,
        effortScore: 6,
        reusabilityScore: 9,
      },
      normalizeIdeaPrioritySettings({
        hotIdeaVoteThreshold: 20,
        priorityScoreMultiplier: 1,
      }),
    )

    expect(score).toBe(84)
  })

  it('auto promotes pending ideas once vote threshold is reached', () => {
    const settings = normalizeIdeaPrioritySettings({
      hotIdeaVoteThreshold: 12,
      priorityScoreMultiplier: 1,
    })

    expect(
      shouldAutoPromoteIdea(
        {
          status: 'pending',
          voteCount: 12,
        },
        settings,
      ),
    ).toBe(true)
    expect(getIdeaAutoPromotionReason(settings)).toContain('12')
  })

  it('does not auto promote ideas that are already being processed', () => {
    expect(
      shouldAutoPromoteIdea({
        status: 'discussing',
        voteCount: 999,
      }),
    ).toBe(false)
  })
})
