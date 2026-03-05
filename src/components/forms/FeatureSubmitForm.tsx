'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'
import { OtpAuthPanel } from '@/components/forms/OtpAuthPanel'

export function FeatureSubmitForm({ ideaId }: { ideaId: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('idle')
    setMessage('')

    const response = await fetch('/api/lab/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, content }),
    })
    const json = await response.json()

    if (!response.ok || !json.ok) {
      setStatus('error')
      setMessage(json?.error?.message || '提交失败，请先完成 OTP 登录。')
      return
    }

    setStatus('success')
    setMessage('Feature 建议已提交。')
    setContent('')
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.title}>提交共创 Feature</p>
      <textarea
        className={styles.textarea}
        placeholder="描述你希望新增的功能"
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={!content}>
          提交建议
        </button>
      </div>
      {status === 'error' ? <p className={styles.error}>{message}</p> : null}
      {status === 'success' ? <p className={styles.success}>{message}</p> : null}
      <OtpAuthPanel />
    </form>
  )
}
