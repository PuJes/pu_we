import { redirect } from 'next/navigation'

import { buildAdminBridgeHref } from '@/lib/auth/admin'
import { getSessionFromCookies } from '@/lib/auth/session'

import AdminLoginClient from './AdminLoginClient'
import styles from './page.module.css'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function isPayloadAdminPath(path: string) {
  return path === '/admin' || path.startsWith('/admin/')
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const next = getParam(params.next) || '/admin-dashboard'
  const session = await getSessionFromCookies()

  if (session?.role === 'admin') {
    redirect(isPayloadAdminPath(next) ? buildAdminBridgeHref(next) : next)
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>Admin Access</span>
          <h1>后台统一登录入口</h1>
          <p>管理员通过同一套 OTP 身份进入后台指挥台；进入 Payload 原生后台时会自动接力成 Payload 会话。</p>
        </div>
        <AdminLoginClient nextPath={next} initialSessionEmail={session?.email || ''} initialRole={session?.role || 'guest'} />
      </section>
    </main>
  )
}
