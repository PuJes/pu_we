'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { requestJson } from '@/components/forms/request'

import styles from './page.module.css'

type AdminLoginClientProps = {
  nextPath: string
  initialSessionEmail: string
  initialRole: 'admin' | 'user' | 'guest'
}

function isPayloadAdminPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

function mapOtpError(code?: string, fallback?: string) {
  if (code === 'RATE_LIMITED') return '请求过于频繁，请稍后再试。'
  if (code === 'OTP_EXPIRED') return '验证码已过期，请重新发送。'
  if (code === 'INVALID_INPUT') return '验证码错误，请检查后重试。'
  return fallback || '操作失败，请稍后重试。'
}

export default function AdminLoginClient({
  nextPath,
  initialSessionEmail,
  initialRole,
}: AdminLoginClientProps) {
  const router = useRouter()
  const [role, setRole] = useState(initialRole)
  const [email, setEmail] = useState(initialSessionEmail)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState(
    initialRole === 'user'
      ? `当前浏览器已登录普通用户 ${initialSessionEmail}，请先切换账号后再验证管理员邮箱。`
      : '',
  )
  const [loading, setLoading] = useState(false)

  const canUseOtp = role !== 'user'
  const ctaLabel = useMemo(
    () => (isPayloadAdminPath(nextPath) ? '验证并进入 Payload 后台' : '验证并进入后台'),
    [nextPath],
  )

  async function sendOtp() {
    setLoading(true)
    setMessage('')

    const { response, json, networkError } = await requestJson('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (networkError || !response) {
      setMessage('网络异常，请稍后重试。')
      setLoading(false)
      return
    }

    if (!response.ok || !json?.ok) {
      setMessage(mapOtpError(json?.error?.code, json?.error?.message))
      setLoading(false)
      return
    }

    const mockCode =
      json.data && typeof json.data === 'object' && 'mockCode' in json.data
        ? (json.data as { mockCode?: string }).mockCode
        : undefined

    setMessage(mockCode ? `开发环境验证码：${mockCode}` : '验证码已发送，请检查邮箱。')
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setMessage('')

    const { response, json, networkError } = await requestJson('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    })

    if (networkError || !response) {
      setMessage('网络异常，请稍后重试。')
      setLoading(false)
      return
    }

    if (!response.ok || !json?.ok) {
      setMessage(mapOtpError(json?.error?.code, json?.error?.message))
      setLoading(false)
      return
    }

    const data = json.data as { role?: string } | undefined
    if (data?.role !== 'admin') {
      setRole('user')
      setMessage('这个邮箱已通过验证，但它不是管理员账号。请切换成管理员邮箱后重试。')
      setLoading(false)
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  async function switchAccount() {
    setLoading(true)
    setMessage('')

    const { response, networkError } = await requestJson('/api/auth/logout', {
      method: 'POST',
    })

    if (networkError || !response?.ok) {
      setMessage('切换账号失败，请刷新后重试。')
      setLoading(false)
      return
    }

    setRole('guest')
    setCode('')
    setEmail('')
    setMessage('当前会话已退出，请输入管理员邮箱并重新验证。')
    setLoading(false)
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelBadge}>OTP Admin Login</span>
        <h2>管理员邮箱验证</h2>
        <p>使用 `admins` 集合里的邮箱完成 OTP 验证。验证通过后，会按目标地址自动进入工作台或 Payload 后台。</p>
      </div>

      {role === 'user' ? (
        <div className={styles.blockedState}>
          <p>{message}</p>
          <button className={styles.secondaryButton} type="button" onClick={switchAccount} disabled={loading}>
            退出当前用户并切换账号
          </button>
        </div>
      ) : (
        <>
          <label className={styles.field}>
            <span>管理员邮箱</span>
            <input
              type="email"
              value={email}
              placeholder="admin@your-domain.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>6 位验证码</span>
            <input
              type="text"
              value={code}
              placeholder="输入收到的验证码"
              maxLength={6}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>

          <div className={styles.actions}>
            <button className={styles.secondaryButton} type="button" onClick={sendOtp} disabled={loading || !email}>
              发送验证码
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={verifyOtp}
              disabled={loading || !email || code.length !== 6 || !canUseOtp}
            >
              {ctaLabel}
            </button>
          </div>
        </>
      )}

      {message ? <p className={role === 'user' ? styles.error : styles.tip}>{message}</p> : null}
      <p className={styles.note}>开发环境下，验证码会直接显示在页面和 server 日志里；生产环境会通过邮件发送。</p>
    </section>
  )
}
