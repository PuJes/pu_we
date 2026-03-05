'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'

export function CommentForm({
  targetType,
  targetId,
}: {
  targetType: 'content' | 'idea' | 'feature'
  targetId: string
}) {
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setIsError(false)

    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetType,
        targetId,
        guestName,
        guestEmail: guestEmail || undefined,
        content,
      }),
    })

    const json = await response.json()

    if (!response.ok || !json.ok) {
      setIsError(true)
      setMessage(json?.error?.message || '评论提交失败')
      return
    }

    setContent('')
    setMessage('评论已提交，等待审核通过后展示。')
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.title}>评论</p>
      <div className={styles.grid2}>
        <input
          className={styles.input}
          placeholder="昵称"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
        />
        <input
          className={styles.input}
          placeholder="邮箱（选填）"
          value={guestEmail}
          onChange={(event) => setGuestEmail(event.target.value)}
        />
      </div>
      <textarea
        className={styles.textarea}
        placeholder="写下你的想法"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={!content}>
          提交评论
        </button>
      </div>
      {message ? <p className={isError ? styles.error : styles.success}>{message}</p> : null}
    </form>
  )
}
