'use client'

import { useState } from 'react'

import styles from '@/components/forms/form.module.css'

export function VoteButton({
  ideaId,
  initialCount,
}: {
  ideaId: string
  initialCount: number
}) {
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function handleVote() {
    if (loading) {
      return
    }

    setLoading(true)
    const optimistic = count + 1
    setCount(optimistic)

    const response = await fetch(`/api/lab/ideas/${ideaId}/vote`, {
      method: 'POST',
    })

    const json = await response.json()
    setLoading(false)

    if (!response.ok || !json.ok) {
      setCount(initialCount)
    }
  }

  return (
    <button type="button" className={styles.voteButton} onClick={handleVote}>
      👍 {count}
    </button>
  )
}
