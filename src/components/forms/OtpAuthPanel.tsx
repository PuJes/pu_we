'use client'

import { useState } from 'react'

import styles from '@/components/forms/form.module.css'

export function OtpAuthPanel({ onVerified }: { onVerified?: () => void }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  async function sendOtp() {
    setLoading(true)
    setMessage('')
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = await response.json()
    setLoading(false)

    if (!response.ok || !json.ok) {
      setMessage(json?.error?.message || '发送验证码失败')
      return
    }

    setMessage('验证码已发送，请检查邮箱')
  }

  async function verifyOtp() {
    setLoading(true)
    setMessage('')

    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })
    const json = await response.json()
    setLoading(false)

    if (!response.ok || !json.ok) {
      setMessage(json?.error?.message || '验证码验证失败')
      return
    }

    setVerified(true)
    setMessage('已验证，可继续提交')
    onVerified?.()
  }

  return (
    <div className={styles.panel}>
      <p className={styles.title}>OTP 登录</p>
      <div className={styles.grid2}>
        <input
          className={styles.input}
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className={styles.input}
          type="text"
          placeholder="6 位验证码"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          maxLength={6}
        />
      </div>
      <div className={styles.actions}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={sendOtp}
          disabled={loading || verified || !email}
        >
          发送验证码
        </button>
        <button
          className={styles.button}
          type="button"
          onClick={verifyOtp}
          disabled={loading || verified || !email || code.length !== 6}
        >
          验证并登录
        </button>
      </div>
      {message ? (
        <p className={verified ? styles.success : styles.tip}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
