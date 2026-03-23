'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'
import { OtpAuthPanel } from '@/components/forms/OtpAuthPanel'
import { requestJson } from '@/components/forms/request'

export function FeatureSubmitForm({ ideaId }: { ideaId: string }) {
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [retryAfterOtp, setRetryAfterOtp] = useState(false)

  async function submitFeature() {
    setStatus('idle')
    setMessage('')

    const { response, json, networkError } = await requestJson('/api/lab/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaId, content }),
    })

    if (networkError || !response) {
      setStatus('error')
      setMessage('网络异常，请稍后重试。')
      return false
    }

    if (!response.ok || !json?.ok) {
      if (json?.error?.code === 'UNAUTHORIZED') {
        setStatus('error')
        setMessage('请先完成 OTP 验证，再提交功能建议。')
        setShowOtp(true)
        setRetryAfterOtp(true)
        return false
      }
      setStatus('error')
      setMessage(json?.error?.message || '提交失败，请稍后重试。')
      return false
    }

    setStatus('success')
    setMessage('Feature 建议已提交。')
    setContent('')
    return true
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitFeature()
  }

  async function handleOtpVerified() {
    setShowOtp(false)
    if (retryAfterOtp) {
      setRetryAfterOtp(false)
      await submitFeature()
    }
  }

  return (
    <>
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
        <p className={styles.tip}>建议先说明场景、触发条件和你期望的结果。</p>
        {status === 'error' ? <p className={styles.error}>{message}</p> : null}
        {status === 'success' ? <p className={styles.success}>{message}</p> : null}
      </form>
      <OtpAuthPanel
        open={showOtp}
        onClose={() => setShowOtp(false)}
        onVerified={() => {
          void handleOtpVerified()
        }}
      />
    </>
  )
}
