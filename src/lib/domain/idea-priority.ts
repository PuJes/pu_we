import type { IdeaStatus } from '@/lib/domain/idea-state-machine'

export type IdeaPrioritySettings = {
  hotIdeaVoteThreshold: number
  priorityScoreMultiplier: number
}

export type IdeaPriorityInput = {
  voteCount?: number
  impactScore?: number
  effortScore?: number
  reusabilityScore?: number
  status?: IdeaStatus
}

export const DEFAULT_IDEA_PRIORITY_SETTINGS: IdeaPrioritySettings = {
  hotIdeaVoteThreshold: 20,
  priorityScoreMultiplier: 1,
}

function toFiniteNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

export function normalizeIdeaPrioritySettings(
  value?: Partial<IdeaPrioritySettings> | null,
): IdeaPrioritySettings {
  const hotIdeaVoteThreshold = Math.max(
    1,
    Math.round(
      toFiniteNumber(value?.hotIdeaVoteThreshold, DEFAULT_IDEA_PRIORITY_SETTINGS.hotIdeaVoteThreshold),
    ),
  )
  const priorityScoreMultiplier = Math.max(
    0,
    toFiniteNumber(value?.priorityScoreMultiplier, DEFAULT_IDEA_PRIORITY_SETTINGS.priorityScoreMultiplier),
  )

  return {
    hotIdeaVoteThreshold,
    priorityScoreMultiplier,
  }
}

export function calculateIdeaPriorityScore(
  input: IdeaPriorityInput,
  settings: IdeaPrioritySettings = DEFAULT_IDEA_PRIORITY_SETTINGS,
) {
  const voteCount = Math.max(0, Math.round(toFiniteNumber(input.voteCount)))
  const impactScore = Math.max(0, toFiniteNumber(input.impactScore))
  const effortScore = Math.max(0, toFiniteNumber(input.effortScore))
  const reusabilityScore = Math.max(0, toFiniteNumber(input.reusabilityScore))

  const weightedVotes = voteCount * settings.priorityScoreMultiplier
  const weightedBusinessValue = impactScore * 4 + reusabilityScore * 2
  const weightedEffortPenalty = effortScore * 2

  return Math.max(0, Math.round(weightedVotes + weightedBusinessValue - weightedEffortPenalty))
}

export function shouldAutoPromoteIdea(
  input: Pick<IdeaPriorityInput, 'status' | 'voteCount'>,
  settings: IdeaPrioritySettings = DEFAULT_IDEA_PRIORITY_SETTINGS,
) {
  const status = input.status || 'pending'
  const voteCount = Math.max(0, Math.round(toFiniteNumber(input.voteCount)))

  return status === 'pending' && voteCount >= settings.hotIdeaVoteThreshold
}

export function getIdeaAutoPromotionReason(
  settings: IdeaPrioritySettings = DEFAULT_IDEA_PRIORITY_SETTINGS,
) {
  return `系统自动推进：票数达到 ${settings.hotIdeaVoteThreshold}，进入评估。`
}
