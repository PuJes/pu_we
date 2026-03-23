'use client'

import { FormEvent, useMemo, useState } from 'react'

type SubscribeFormProps = {
  className?: string
  inputClassName?: string
  buttonClassName?: string
  feedbackClassName?: string
  buttonText?: string
  successText?: string
  placeholder?: string
}

function mapSubscribeError(code?: string) {
  if (code === 'UNAUTHORIZED') {
    return '请填写有效邮箱后再订阅。'
  }

  if (code === 'INVALID_INPUT') {
    return '邮箱格式有误，请检查后重试。'
  }

  if (code === 'RATE_LIMITED') {
    return '操作太频繁，请稍后再试。'
  }

  return '订阅失败，请稍后重试。'
}

export function SubscribeForm({
  className,
  inputClassName,
  buttonClassName,
  feedbackClassName,
  buttonText = '立即订阅',
  successText = '订阅成功，欢迎加入。',
  placeholder = 'your@email.com',
}: SubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const disabled = useMemo(() => status === 'loading' || !email.trim(), [email, status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscribed: true }),
      })

      const json = await response.json()

      if (!response.ok || !json.ok) {
        setStatus('error')
        setMessage(mapSubscribeError(json?.error?.code))
        return
      }

      setStatus('success')
      setMessage(successText)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('网络异常，请稍后重试。')
    }
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      <input
        className={inputClassName}
        name="email"
        type="email"
        placeholder={placeholder}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <button className={buttonClassName} type="submit" disabled={disabled}>
        {status === 'loading' ? '提交中...' : buttonText}
      </button>
      {message ? (
        <p data-state={status} className={feedbackClassName}>
          {message}
        </p>
      ) : null}
    </form>
  )
}
