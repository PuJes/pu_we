import Link from 'next/link'

import AdminShell from './_components/AdminShell'
import { dispatchPendingNotificationsAction } from './actions'
import {
  formatAdminEvent,
  formatDateTime,
  formatFeatureStatus,
  formatIdeaStatus,
  getAdminOverviewData,
  getCommentAuthor,
  getFeatureIdeaAdminHref,
  getFeatureIdeaTitle,
  getIdeaPriorityLabel,
} from './lib'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = getParam(params.notice)
  const tone = getParam(params.tone) === 'error' ? 'error' : 'success'
  const { triageIdeas, pendingComments, activeFeatures, staleIdeas, shippedIdeas, adminActivity, inbox, weekly } =
    await getAdminOverviewData()

  return (
    <AdminShell
      active="overview"
      currentPath="/admin-dashboard"
      title="后台指挥台"
      description="先处理会阻塞公开实验室流转的对象：达阈值的 Idea、待审评论、待采纳功能，以及超时未更新的开发项。"
      notice={notice || undefined}
      tone={tone}
      actions={
        <div className={styles.actions}>
          <Link className={styles.secondaryLink} href="/admin-dashboard/wireframes">
            查看结构线稿
          </Link>
          <Link className={styles.secondaryLink} href="/admin">
            Payload 后台
          </Link>
          <form action={dispatchPendingNotificationsAction}>
            <input type="hidden" name="returnTo" value="/admin-dashboard" />
            <button className={styles.primaryButton} type="submit">
              派发待处理通知
            </button>
          </form>
        </div>
      }
    >
      <section className={styles.metricGrid}>
        <article className={styles.metricCard}>
          <small>待分诊 Idea</small>
          <strong>{inbox.pendingIdeas}</strong>
          <p>先看已达阈值但还没有明确结论的想法。</p>
          <Link href="/admin-dashboard/triage?status=all">进入分诊台</Link>
        </article>
        <article className={styles.metricCard}>
          <small>待审评论</small>
          <strong>{inbox.pendingComments}</strong>
          <p>决定哪些互动应该公开，哪些需要驳回或保留。</p>
          <Link href="/admin-dashboard/reviews?queue=comments">进入审核队列</Link>
        </article>
        <article className={styles.metricCard}>
          <small>开放功能</small>
          <strong>{inbox.openFeatures}</strong>
          <p>合并重复建议，并把高价值建议推进到 planned 或 done。</p>
          <Link href="/admin-dashboard/reviews?queue=features">处理功能建议</Link>
        </article>
        <article className={styles.metricCard}>
          <small>超时开发</small>
          <strong>{inbox.staleInProgressIdeas}</strong>
          <p>开发中超过 7 天没有更新，应该补 Builder Log 或明确阻塞。</p>
          <Link href="/admin-dashboard/triage?status=in-progress">查看卡点</Link>
        </article>
      </section>

      <section className={styles.boardGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>优先处理的 Idea</h2>
              <p>按优先级排序，直接跳进对应分诊对象。</p>
            </div>
            <Link href="/admin-dashboard/triage">全部查看</Link>
          </div>

          <div className={styles.stack}>
            {triageIdeas.slice(0, 5).map((idea) => (
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
                  <span>{idea.voteCount} 票</span>
                  <span>优先级 {idea.priorityScore || 0}</span>
                  <span>{getIdeaPriorityLabel(idea)}</span>
                  <span>{formatDateTime(idea.updatedAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>审核队列快照</h2>
              <p>评论审核和功能建议合并看，减少来回跳表。</p>
            </div>
            <Link href="/admin-dashboard/reviews">打开审核页</Link>
          </div>

          <div className={styles.subSection}>
            <h3>待审评论</h3>
            {pendingComments.length > 0 ? (
              <div className={styles.stack}>
                {pendingComments.slice(0, 3).map((comment) => (
                  <Link
                    key={comment.id}
                    href={`/admin-dashboard/reviews?kind=comment&itemId=${comment.id}`}
                    className={styles.rowCard}
                  >
                    <div className={styles.rowHead}>
                      <strong>{getCommentAuthor(comment)}</strong>
                      <span>{comment.targetType.toUpperCase()}</span>
                    </div>
                    <p>{comment.content}</p>
                    <div className={styles.rowMeta}>
                      <span>{formatDateTime(comment.createdAt)}</span>
                      <span>{comment.upvotes} 顶</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>当前没有待审评论。</div>
            )}
          </div>

          <div className={styles.subSection}>
            <h3>待处理功能建议</h3>
            {activeFeatures.length > 0 ? (
              <div className={styles.stack}>
                {activeFeatures.slice(0, 3).map((feature) => (
                  <Link
                    key={feature.id}
                    href={`/admin-dashboard/reviews?kind=feature&itemId=${feature.id}`}
                    className={styles.rowCard}
                  >
                    <div className={styles.rowHead}>
                      <strong>{getFeatureIdeaTitle(feature)}</strong>
                      <span>{formatFeatureStatus(feature.status)}</span>
                    </div>
                    <p>{feature.content}</p>
                    <div className={styles.rowMeta}>
                      <span>{feature.voteCount} 支持</span>
                      <span>{formatDateTime(feature.updatedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>当前没有待处理功能建议。</div>
            )}
          </div>
        </article>
      </section>

      <section className={styles.bottomGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>开发中卡点</h2>
              <p>这些项目需要你补 Builder Log 或明确下一步。</p>
            </div>
            <Link href="/admin-dashboard/triage?status=in-progress">处理卡点</Link>
          </div>

          {staleIdeas.length > 0 ? (
            <div className={styles.stack}>
              {staleIdeas.map((idea) => (
                <Link
                  key={idea.id}
                  href={`/admin-dashboard/triage?status=in-progress&ideaId=${idea.id}`}
                  className={styles.rowCard}
                >
                  <div className={styles.rowHead}>
                    <strong>{idea.title}</strong>
                    <span>{formatDateTime(idea.updatedAt)}</span>
                  </div>
                  <p>{idea.statusChangeReason || '需要补充当前阻塞、版本目标或 Builder Log。'}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>当前没有超过 7 天未更新的开发项。</div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>周度经营信号</h2>
              <p>快速判断这一周的公开构建是否真的在流动。</p>
            </div>
            <Link href="/admin-dashboard/weekly">查看周度详情</Link>
          </div>

          <div className={styles.weeklyGrid}>
            <div>
              <small>投票新增</small>
              <strong>{weekly.funnel.votes}</strong>
            </div>
            <div>
              <small>评论新增</small>
              <strong>{weekly.funnel.comments}</strong>
            </div>
            <div>
              <small>功能建议新增</small>
              <strong>{weekly.funnel.features}</strong>
            </div>
            <div>
              <small>进入 reviewed</small>
              <strong>{weekly.funnel.reviewed}</strong>
            </div>
          </div>

          <div className={styles.funnelStrip}>
            <span>新创意 {weekly.weeklyActivities.ideas}</span>
            <span>新评论 {weekly.weeklyActivities.comments}</span>
            <span>新功能 {weekly.weeklyActivities.features}</span>
          </div>

          <div className={styles.quickLinks}>
            {activeFeatures[0] ? (
              <Link
                href={getFeatureIdeaAdminHref(activeFeatures[0]) || '/admin-dashboard/triage'}
              >
                跳到最活跃功能所属 Idea
              </Link>
            ) : null}
            <Link href="/lab">查看公开实验室前台</Link>
          </div>
        </article>
      </section>

      <section className={styles.insightGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>本周真实交付</h2>
              <p>进入 launched / reviewed 的 Idea 与对应成果。</p>
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

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>后台操作记录</h2>
              <p>最近的运营动作，确保没有漏掉关键处理。</p>
            </div>
            <Link href="/admin-dashboard/reviews">去审核队列</Link>
          </div>

          {adminActivity.length > 0 ? (
            <div className={styles.timeline}>
              {adminActivity.map((item) => (
                <div key={item.id} className={styles.timelineItem}>
                  <small>{formatDateTime(item.createdAt)}</small>
                  <strong>{formatAdminEvent(item.event)}</strong>
                  <p>{item.meta?.note ? String(item.meta.note) : '后台已记录此次动作。'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>还没有后台操作记录。</div>
          )}
        </article>
      </section>
    </AdminShell>
  )
}
