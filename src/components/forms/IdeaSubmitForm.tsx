'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'
import { OtpAuthPanel } from '@/components/forms/OtpAuthPanel'

export function IdeaSubmitForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('idle')
    setMessage('')

    const response = await fetch('/api/lab/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })

    const json = await response.json()

    if (!response.ok || !json.ok) {
      setStatus('error')
      setMessage(json?.error?.message || '提交失败，请先完成 OTP 登录。')
      return
    }

    setStatus('success')
    setMessage('Idea 已提交，等待后台评估。')
    setTitle('')
    setDescription('')
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.title}>提交新 Idea</p>
      <input
        className={styles.input}
        placeholder="标题"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        className={styles.textarea}
        placeholder="描述痛点、目标用户、预期价值"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={!title || !description}>
          提交
        </button>
      </div>
      {status === 'error' ? <p className={styles.error}>{message}</p> : null}
      {status === 'success' ? <p className={styles.success}>{message}</p> : null}
      <OtpAuthPanel />
    </form>
  )
}
