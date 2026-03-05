import { describe, expect, it } from 'vitest'

import {
  assertIdeaTransition,
  getNextIdeaStatuses,
  isValidIdeaTransition,
} from '@/lib/domain/idea-state-machine'

describe('idea state machine', () => {
  it('allows legal transitions', () => {
    expect(isValidIdeaTransition('pending', 'discussing')).toBe(true)
    expect(isValidIdeaTransition('discussing', 'approved')).toBe(true)
  })

  it('blocks illegal transitions', () => {
    expect(isValidIdeaTransition('pending', 'approved')).toBe(false)
    expect(() => assertIdeaTransition('pending', 'approved')).toThrowError(
      'Illegal idea status transition: pending -> approved',
    )
  })

  it('exposes next statuses', () => {
    expect(getNextIdeaStatuses('approved')).toEqual(['in-progress'])
    expect(getNextIdeaStatuses('reviewed')).toEqual([])
  })
})
