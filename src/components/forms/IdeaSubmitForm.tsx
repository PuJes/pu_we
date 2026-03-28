'use client'

import { FormEvent, useState } from 'react'

import styles from '@/components/forms/form.module.css'
import { OtpAuthPanel } from '@/components/forms/OtpAuthPanel'
import { requestJson } from '@/components/forms/request'

export function IdeaSubmitForm({ submitLabel = '提交你的创意' }: { submitLabel?: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [retryAfterOtp, setRetryAfterOtp] = useState(false)

  async function submitIdea() {
    setStatus('idle')
    setMessage('')

    const { response, json, networkError } = await requestJson('/api/lab/ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })

    if (networkError || !response) {
      setStatus('error')
      setMessage('网络异常，请稍后重试。')
      return false
    }

    if (!response.ok || !json?.ok) {
      if (json?.error?.code === 'UNAUTHORIZED') {
        setStatus('error')
        setMessage('请先完成 OTP 验证，再提交创意。')
        setShowOtp(true)
        setRetryAfterOtp(true)
        return false
      }
      setStatus('error')
      setMessage(json?.error?.message || '提交失败，请稍后重试。')
      return false
    }

    setStatus('success')
    setMessage('Idea 已提交，等待后台评估。')
    setTitle('')
    setDescription('')
    return true
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await submitIdea()
  }

  async function handleOtpVerified() {
    setShowOtp(false)
    if (retryAfterOtp) {
      setRetryAfterOtp(false)
      await submitIdea()
    }
  }

  return (
    <>
      <form className={`${styles.panel} ${styles.ideaPanel}`} onSubmit={handleSubmit}>
        <div className={styles.ideaPanelHead}>
          <span className={styles.ideaBadge}>New submission</span>
          <p className={styles.title}>提交你的创意</p>
          <p className={styles.ideaLead}>写得越具体，进入看板后就越容易被理解、被投票，也越容易被推进。</p>
        </div>
        <input
          className={`${styles.input} ${styles.ideaInput}`}
          placeholder="用一句话说明这是什么问题，或者你想被做出来的东西是什么"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className={`${styles.textarea} ${styles.ideaTextarea}`}
          placeholder="把那个具体时刻写出来：谁在卡住、为什么痛、你理想中的结果应该是什么。"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className={styles.ideaActionRow}>
          <button className={`${styles.button} ${styles.ideaButton}`} type="submit" disabled={!title || !description}>
            {submitLabel}
          </button>
          <span className={styles.ideaMeta}>未登录时会自动弹出 OTP 验证，验证后继续提交。</span>
        </div>
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
