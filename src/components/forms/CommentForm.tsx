'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'
import { requestJson } from '@/components/forms/request'

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

  async function submitComment() {
    setMessage('')
    setIsError(false)

    const { response, json, networkError } = await requestJson('/api/comments', {
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

    if (networkError || !response) {
      setIsError(true)
      setMessage('网络异常，请稍后重试。')
      return
    }

    if (!response.ok || !json?.ok) {
      setIsError(true)
      if (json?.error?.code === 'INVALID_INPUT') {
        setMessage('未登录评论请先填写昵称。')
        return
      }
      setMessage(json?.error?.message || '评论提交失败，请稍后重试。')
      return
    }

    setContent('')
    setMessage('评论已提交，等待审核通过后展示。')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitComment()
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.title}>评论</p>
      <div className={styles.grid2}>
        <input
          className={styles.input}
          placeholder="昵称（未登录时必填）"
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
        />
        <input
          className={styles.input}
          placeholder="邮箱（选填，用于审核通知）"
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
      <p className={styles.tip}>可直接用昵称评论；如果你已完成 OTP 验证，会自动以已验证身份记录。</p>
      {message ? <p className={isError ? styles.error : styles.success}>{message}</p> : null}
    </form>
  )
}
