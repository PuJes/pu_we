import type { ReactNode } from 'react'
import Link from 'next/link'

import { requireAdminFrontendSession } from '@/lib/auth/admin'

import styles from './admin-shell.module.css'

type AdminSection = 'overview' | 'triage' | 'reviews' | 'weekly' | 'wireframes'

type AdminShellProps = {
  active: AdminSection
  currentPath: string
  title: string
  description: string
  notice?: string
  tone?: 'success' | 'error'
  actions?: ReactNode
  children: ReactNode
}

const navItems: Array<{ key: AdminSection; label: string; caption: string; href: string }> = [
  { key: 'overview', label: '指挥台', caption: '统一待办', href: '/admin-dashboard' },
  { key: 'triage', label: 'Idea 分诊', caption: '推进状态', href: '/admin-dashboard/triage' },
  { key: 'reviews', label: '审核队列', caption: '评论与功能', href: '/admin-dashboard/reviews' },
  { key: 'weekly', label: '周度信号', caption: '经营节奏', href: '/admin-dashboard/weekly' },
  { key: 'wireframes', label: '线框参考', caption: '结构稿', href: '/admin-dashboard/wireframes' },
]

export default async function AdminShell({
  active,
  currentPath,
  title,
  description,
  notice,
  tone = 'success',
  actions,
  children,
}: AdminShellProps) {
  const session = await requireAdminFrontendSession(currentPath)

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.eyebrow}>Open Lab Admin</span>
          <strong>JESS.PU</strong>
          <p>公开实验室、内容发布和社区运营在同一套工作台里处理。</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={item.key === active ? styles.activeNavItem : styles.navItem}
            >
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div>
            <small>当前会话</small>
            <strong>{session.email}</strong>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/admin">Payload 后台</Link>
            <Link href="/lab">公开实验室</Link>
          </div>
        </div>
      </aside>

      <div className={styles.viewport}>
        <header className={styles.header}>
          <div>
            <span className={styles.headerKicker}>Workspace</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>

        {notice ? (
          <div className={tone === 'error' ? styles.noticeError : styles.noticeSuccess}>{notice}</div>
        ) : null}

        <div className={styles.content}>{children}</div>
      </div>
    </main>
  )
}
