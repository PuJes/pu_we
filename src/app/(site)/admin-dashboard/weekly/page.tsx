import Link from 'next/link'

import AdminShell from '../_components/AdminShell'
import { formatDateTime, formatIdeaStatus, getAdminOverviewData } from '../lib'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardWeeklyPage() {
  const { weekly, shippedIdeas } = await getAdminOverviewData()

  return (
    <AdminShell
      active="weekly"
      currentPath="/admin-dashboard/weekly"
      title="周度经营信号"
      description="把过去 7 天的公开实验流转汇总成运营视图，避免只盯数据不看交付。"
      actions={
        <div className={styles.actions}>
          <Link className={styles.secondaryLink} href="/admin-dashboard">
            返回指挥台
          </Link>
          <Link className={styles.secondaryLink} href="/lab">
            打开前台
          </Link>
        </div>
      }
    >
      <section className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <small>统计周期</small>
          <strong>{formatDateTime(weekly.since)}</strong>
          <p>统计区间为过去 7 天。</p>
        </article>
        <article className={styles.metricCard}>
          <small>投票新增</small>
          <strong>{weekly.funnel.votes}</strong>
          <p>过去一周新增的投票量。</p>
        </article>
        <article className={styles.metricCard}>
          <small>评论新增</small>
          <strong>{weekly.funnel.comments}</strong>
          <p>过去一周新增的评论量。</p>
        </article>
        <article className={styles.metricCard}>
          <small>功能建议新增</small>
          <strong>{weekly.funnel.features}</strong>
          <p>过去一周新增的功能建议。</p>
        </article>
      </section>

      <section className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>流转漏斗</h2>
              <p>投票、评论和功能建议的流转情况。</p>
            </div>
          </div>
          <div className={styles.funnelGrid}>
            <div>
              <small>新创意</small>
              <strong>{weekly.weeklyActivities.ideas}</strong>
            </div>
            <div>
              <small>新评论</small>
              <strong>{weekly.weeklyActivities.comments}</strong>
            </div>
            <div>
              <small>新功能</small>
              <strong>{weekly.weeklyActivities.features}</strong>
            </div>
            <div>
              <small>进入 Reviewed</small>
              <strong>{weekly.funnel.reviewed}</strong>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>本周交付</h2>
              <p>已上线或完成复盘的 Idea。</p>
            </div>
            <Link href="/admin-dashboard/triage?status=reviewed">查看复盘</Link>
          </div>
          {shippedIdeas.length > 0 ? (
            <div className={styles.stack}>
              {shippedIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/admin-dashboard/triage?ideaId=${idea.id}`}
                  className={styles.rowCard}
                >
                  <div className={styles.rowHead}>
                    <strong>{idea.title}</strong>
                    <span>{formatIdeaStatus(idea.status)}</span>
                  </div>
                  <p>{idea.description}</p>
                  <div className={styles.rowMeta}>
                    <span>{formatDateTime(idea.updatedAt)}</span>
                    {idea.targetVersion ? <span>版本 {idea.targetVersion}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>本周还没有新的交付。</div>
          )}
        </article>
      </section>
    </AdminShell>
  )
}
