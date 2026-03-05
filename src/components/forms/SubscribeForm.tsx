'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setIsError(false)

    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, subscribed: true }),
    })

    const json = await response.json()

    if (!response.ok || !json.ok) {
      setIsError(true)
      setMessage(json?.error?.message || '订阅失败')
      return
    }

    setMessage('订阅成功，后续将通过邮件同步更新。')
    setEmail('')
  }

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <p className={styles.title}>订阅复盘邮件</p>
      <input
        className={styles.input}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={!email}>
          立即订阅
        </button>
      </div>
      {message ? <p className={isError ? styles.error : styles.success}>{message}</p> : null}
    </form>
  )
}
