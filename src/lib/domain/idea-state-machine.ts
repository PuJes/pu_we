export type IdeaStatus =
  | 'pending'
  | 'discussing'
  | 'approved'
  | 'in-progress'
  | 'launched'
  | 'reviewed'

const transitions: Record<IdeaStatus, IdeaStatus[]> = {
  pending: ['discussing'],
  discussing: ['approved'],
  approved: ['in-progress'],
  'in-progress': ['launched'],
  launched: ['reviewed'],
  reviewed: [],
}

export function isValidIdeaTransition(from: IdeaStatus, to: IdeaStatus) {
  return transitions[from]?.includes(to) ?? false
}

export function assertIdeaTransition(from: IdeaStatus, to: IdeaStatus) {
  if (!isValidIdeaTransition(from, to)) {
    throw new Error(`Illegal idea status transition: ${from} -> ${to}`)
  }
}

export function getNextIdeaStatuses(status: IdeaStatus) {
  return transitions[status]
}
