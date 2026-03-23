'use client'

import { useCallback, useRef, useState } from 'react'

import styles from '@/components/forms/form.module.css'

type VoteTarget =
  | { ideaId: string; featureId?: never }
  | { featureId: string; ideaId?: never }

type VoteButtonProps = VoteTarget & {
  initialCount: number
  compact?: boolean
}

export function VoteButton(props: VoteButtonProps) {
  const { initialCount, compact } = props
  const targetType = props.ideaId ? 'idea' : 'feature'
  const targetId = props.ideaId || props.featureId

  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [popping, setPopping] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerPop = useCallback(() => {
    setPopping(true)
    setTimeout(() => setPopping(false), 400)
  }, [])

  async function handleVote() {
    if (loading) return

    // 防抖：300ms 内多次点击只发一次
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    setMessage('')
    setIsError(false)

    // 乐观更新 + 弹跳动效
    const previous = count
    setCount(previous + 1)
    triggerPop()
    setLoading(true)

    debounceRef.current = setTimeout(async () => {
      try {
        const url =
          targetType === 'idea'
            ? `/api/lab/ideas/${targetId}/vote`
            : `/api/lab/features/${targetId}/vote`

        const response = await fetch(url, { method: 'POST' })
        const json = await response.json()

        if (!response.ok || !json.ok) {
          setCount(previous)
          setIsError(true)
          if (json?.error?.code === 'DUPLICATE_VOTE') {
            setMessage('你已经投过票了。')
          } else if (json?.error?.code === 'RATE_LIMITED') {
            setMessage('操作太频繁，请稍后重试。')
          } else {
            setMessage('网络异常，请稍后重试。')
          }
          return
        }

        setMessage('感谢支持！')
        setIsError(false)
      } catch {
        setCount(previous)
        setIsError(true)
        setMessage('网络异常，请稍后重试。')
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const btnClass = [
    styles.voteButton,
    popping ? styles.votePop : '',
    compact ? styles.voteCompact : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={styles.voteWrap}>
      <button type="button" className={btnClass} onClick={handleVote} disabled={loading}>
        {compact ? `👍 ${count}` : loading ? '提交中...' : `👍 我也需要 (${count})`}
      </button>
      {message ? (
        <p className={isError ? styles.voteError : styles.voteTip} aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  )
}
