'use client'

import { useState } from 'react'

import styles from '@/components/forms/form.module.css'

type OtpAuthPanelProps = {
  onVerified?: (email: string) => void
  open?: boolean
  onClose?: () => void
  title?: string
  description?: string
  initialEmail?: string
}

function mapOtpError(code?: string, fallback?: string) {
  if (code === 'RATE_LIMITED') {
    return '请求过于频繁，请稍后再试。'
  }
  if (code === 'OTP_EXPIRED') {
    return '验证码已过期，请重新发送。'
  }
  if (code === 'INVALID_INPUT') {
    return '验证码错误，请检查后重试。'
  }
  return fallback || '操作失败，请稍后重试。'
}

export function OtpAuthPanel({
  onVerified,
  open = true,
  onClose,
  title = 'OTP 登录',
  description = '继续提交前，请先完成一次邮箱验证。',
  initialEmail = '',
}: OtpAuthPanelProps) {
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!open) {
    return null
  }

  async function sendOtp() {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await response.json()

      if (!response.ok || !json.ok) {
        setMessage(mapOtpError(json?.error?.code, json?.error?.message))
        return
      }

      if (typeof json?.data?.mockCode === 'string') {
        setMessage(`开发环境验证码：${json.data.mockCode}`)
        return
      }

      setMessage('验证码已发送，请检查邮箱。')
    } catch {
      setMessage('网络异常，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp() {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const json = await response.json()

      if (!response.ok || !json.ok) {
        setMessage(mapOtpError(json?.error?.code, json?.error?.message))
        return
      }

      setVerified(true)
      setMessage('验证成功，正在继续你的操作。')
      onVerified?.(email)
    } catch {
      setMessage('网络异常，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const panel = (
    <div className={styles.panel}>
      <div className={styles.otpHead}>
        <p className={styles.title}>{title}</p>
        {onClose ? (
          <button type="button" className={styles.otpClose} onClick={onClose} aria-label="关闭">
            ×
          </button>
        ) : null}
      </div>
      <p className={styles.tip}>{description}</p>
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
          验证并继续
        </button>
      </div>
      {message ? <p className={verified ? styles.success : styles.tip}>{message}</p> : null}
    </div>
  )

  if (onClose) {
    return (
      <div className={styles.otpOverlay} role="dialog" aria-modal="true">
        {panel}
      </div>
    )
  }

  return (
    panel
  )
}
