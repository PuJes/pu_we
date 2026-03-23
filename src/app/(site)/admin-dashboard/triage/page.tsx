import Link from 'next/link'

import AdminShell from '../_components/AdminShell'
import { updateIdeaAction } from '../actions'
import {
  formatCommentStatus,
  formatDateTime,
  formatFeatureStatus,
  formatIdeaStatus,
  type TriageStatusFilter,
  getCommentAuthor,
  getFeatureIdeaPublicHref,
  getIdeaPriorityLabel,
  getIdeaTriageData,
  parseSelectedId,
  parseTriageSort,
  parseTriageStatusFilter,
} from '../lib'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function buildPath(params: {
  status?: TriageStatusFilter
  sort?: 'priority' | 'latest'
  ideaId?: string
}) {
  const search = new URLSearchParams()

  if (params.status && params.status !== 'all') {
    search.set('status', params.status)
  }

  if (params.sort && params.sort !== 'priority') {
    search.set('sort', params.sort)
  }

  if (params.ideaId) {
    search.set('ideaId', params.ideaId)
  }

  const query = search.toString()
  return query ? `/admin-dashboard/triage?${query}` : '/admin-dashboard/triage'
}

export default async function AdminDashboardTriagePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const status = parseTriageStatusFilter(getParam(params.status))
  const sort = parseTriageSort(getParam(params.sort))
  const ideaId = parseSelectedId(getParam(params.ideaId))
  const notice = getParam(params.notice)
  const tone = getParam(params.tone) === 'error' ? 'error' : 'success'

  const { ideas, selectedIdea, relatedFeatures, relatedComments, nextStatuses } =
    await getIdeaTriageData({
      ideaId,
      status,
      sort,
    })

  const selectedPath = buildPath({
    status: status === 'all' ? undefined : status,
    sort: sort === 'priority' ? undefined : sort,
    ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
  })

  const builderLogs =
    selectedIdea?.builderLogs && selectedIdea.builderLogs.length > 0
      ? [...selectedIdea.builderLogs].reverse().slice(0, 4)
      : []
  const statusHistory =
    selectedIdea?.statusHistory && selectedIdea.statusHistory.length > 0
      ? [...selectedIdea.statusHistory].reverse().slice(0, 4)
      : []

  return (
    <AdminShell
      active="triage"
      title="Idea 分诊台"
      description="在这里筛选想法、推进状态、补充 Builder Log，并把一个公开实验往上线和复盘方向持续推进。"
      notice={notice || undefined}
      tone={tone}
      actions={
        <div className={styles.actions}>
          {selectedIdea ? (
            <Link className={styles.secondaryLink} href={`/lab/idea/${selectedIdea.slug}`}>
              查看公开页
            </Link>
          ) : null}
          <Link className={styles.secondaryLink} href="/admin-dashboard/reviews">
            去审核队列
          </Link>
        </div>
      }
    >
      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          {(['all', 'pending', 'discussing', 'approved', 'in-progress', 'launched', 'reviewed'] as const).map((item) => (
            <Link
              key={item}
              href={buildPath({
                status: item === 'all' ? undefined : item,
                sort: sort === 'priority' ? undefined : sort,
                ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
              })}
              className={status === item ? styles.activeFilter : styles.filterLink}
            >
              {item === 'all' ? '全部状态' : formatIdeaStatus(item)}
            </Link>
          ))}
        </div>

        <div className={styles.filterGroup}>
          <Link
            href={buildPath({
              status: status === 'all' ? undefined : status,
              ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
            })}
            className={sort === 'priority' ? styles.activeFilter : styles.filterLink}
          >
            按优先级
          </Link>
          <Link
            href={buildPath({
              status: status === 'all' ? undefined : status,
              sort: 'latest',
              ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
            })}
            className={sort === 'latest' ? styles.activeFilter : styles.filterLink}
          >
            按最新时间
          </Link>
        </div>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.queuePanel}>
          <div className={styles.panelHead}>
            <h2>待处理队列</h2>
            <span>{ideas.length} 条</span>
          </div>

          <div className={styles.queueList}>
            {ideas.length > 0 ? (
              ideas.map((idea) => (
                <Link
                  key={idea.id}
                  href={buildPath({
                    status: status === 'all' ? undefined : status,
                    sort: sort === 'priority' ? undefined : sort,
                    ideaId: String(idea.id),
                  })}
                  className={selectedIdea?.id === idea.id ? styles.activeQueueItem : styles.queueItem}
                >
                  <div className={styles.queueItemHead}>
                    <strong>{idea.title}</strong>
                    <span>{formatIdeaStatus(idea.status)}</span>
                  </div>
                  <p>{idea.description}</p>
                  <div className={styles.queueMeta}>
                    <span>{idea.voteCount} 票</span>
                    <span>优先级 {idea.priorityScore || 0}</span>
                    <span>{getIdeaPriorityLabel(idea)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className={styles.emptyState}>当前筛选条件下没有 Idea。</div>
            )}
          </div>
        </aside>

        <section className={styles.detailPanel}>
          {selectedIdea ? (
            <>
              <article className={styles.heroCard}>
                <div>
                  <small>当前分诊对象</small>
                  <h2>{selectedIdea.title}</h2>
                  <p>{selectedIdea.description}</p>
                </div>
                <div className={styles.heroMeta}>
                  <span>{formatIdeaStatus(selectedIdea.status)}</span>
                  <span>{selectedIdea.voteCount} 票</span>
                  <span>优先级 {selectedIdea.priorityScore || 0}</span>
                  {selectedIdea.targetVersion ? <span>版本 {selectedIdea.targetVersion}</span> : null}
                </div>
              </article>

              <div className={styles.metricsGrid}>
                <article className={styles.metricCard}>
                  <small>Impact</small>
                  <strong>{selectedIdea.impactScore || 0}</strong>
                </article>
                <article className={styles.metricCard}>
                  <small>Effort</small>
                  <strong>{selectedIdea.effortScore || 0}</strong>
                </article>
                <article className={styles.metricCard}>
                  <small>Reusability</small>
                  <strong>{selectedIdea.reusabilityScore || 0}</strong>
                </article>
                <article className={styles.metricCard}>
                  <small>更新时间</small>
                  <strong>{formatDateTime(selectedIdea.updatedAt)}</strong>
                </article>
              </div>

              <div className={styles.contextGrid}>
                <article className={styles.panelCard}>
                  <div className={styles.panelHead}>
                    <h3>Builder Log</h3>
                    <span>{builderLogs.length} 条</span>
                  </div>
                  {builderLogs.length > 0 ? (
                    <div className={styles.timeline}>
                      {builderLogs.map((item) => (
                        <div key={`${item.date}-${item.content}`} className={styles.timelineItem}>
                          <small>{formatDateTime(item.date)}</small>
                          <strong>{item.version ? `v${item.version}` : '记录'}</strong>
                          <p>{item.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>当前还没有 Builder Log。</div>
                  )}
                </article>

                <article className={styles.panelCard}>
                  <div className={styles.panelHead}>
                    <h3>状态流转</h3>
                    <span>{statusHistory.length} 条</span>
                  </div>
                  {statusHistory.length > 0 ? (
                    <div className={styles.timeline}>
                      {statusHistory.map((item) => (
                        <div key={`${item.changedAt}-${item.toStatus}`} className={styles.timelineItem}>
                          <small>{formatDateTime(item.changedAt)}</small>
                          <strong>
                            {formatIdeaStatus(item.fromStatus as typeof selectedIdea.status)} →{' '}
                            {formatIdeaStatus(item.toStatus as typeof selectedIdea.status)}
                          </strong>
                          <p>{item.reason || '未填写原因'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>当前还没有状态历史。</div>
                  )}
                </article>
              </div>

              <div className={styles.contextGrid}>
                <article className={styles.panelCard}>
                  <div className={styles.panelHead}>
                    <h3>关联功能建议</h3>
                    <span>{relatedFeatures.length} 条</span>
                  </div>
                  {relatedFeatures.length > 0 ? (
                    <div className={styles.stack}>
                      {relatedFeatures.map((feature) => (
                        <Link
                          key={feature.id}
                          href={`/admin-dashboard/reviews?kind=feature&itemId=${feature.id}`}
                          className={styles.inlineCard}
                        >
                          <div className={styles.inlineCardHead}>
                            <strong>{formatFeatureStatus(feature.status)}</strong>
                            <span>{feature.voteCount} 支持</span>
                          </div>
                          <p>{feature.content}</p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>当前没有关联功能建议。</div>
                  )}
                </article>

                <article className={styles.panelCard}>
                  <div className={styles.panelHead}>
                    <h3>关联评论</h3>
                    <span>{relatedComments.length} 条</span>
                  </div>
                  {relatedComments.length > 0 ? (
                    <div className={styles.stack}>
                      {relatedComments.map((comment) => (
                        <div key={comment.id} className={styles.inlineCard}>
                          <div className={styles.inlineCardHead}>
                            <strong>{getCommentAuthor(comment)}</strong>
                            <span>{formatCommentStatus(comment.status)}</span>
                          </div>
                          <p>{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>当前没有关联评论。</div>
                  )}
                </article>
              </div>
            </>
          ) : (
            <div className={styles.emptyCanvas}>先从左侧选一条 Idea 开始分诊。</div>
          )}
        </section>

        <aside className={styles.actionPanel}>
          {selectedIdea ? (
            <form action={updateIdeaAction} className={styles.actionForm}>
              <input type="hidden" name="ideaId" value={selectedIdea.id} />
              <input type="hidden" name="returnTo" value={selectedPath} />

              <div className={styles.formSection}>
                <h3>推进状态</h3>
                <label>
                  <span>下一状态</span>
                  <select name="nextStatus" defaultValue="">
                    <option value="">保持当前状态</option>
                    {nextStatuses.map((item) => (
                      <option key={item} value={item}>
                        {formatIdeaStatus(item)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>目标版本</span>
                  <input
                    type="text"
                    name="targetVersion"
                    defaultValue={selectedIdea.targetVersion || ''}
                    placeholder="例如 v0.3"
                  />
                </label>

                <label>
                  <span>状态原因</span>
                  <textarea
                    name="statusChangeReason"
                    rows={5}
                    placeholder="说明为什么推进、为什么暂缓、当前风险是什么。"
                    defaultValue={selectedIdea.statusChangeReason || ''}
                  />
                </label>
              </div>

              <div className={styles.formSection}>
                <h3>补充 Builder Log</h3>
                <label>
                  <span>版本标签</span>
                  <input type="text" name="builderLogVersion" placeholder="例如 v0.3-alpha" />
                </label>

                <label>
                  <span>日志内容</span>
                  <textarea
                    name="builderLogContent"
                    rows={6}
                    placeholder="记录这次判断、阻塞点、实验结论或接下来要做什么。"
                  />
                </label>
              </div>

              <button className={styles.primaryButton} type="submit">
                保存分诊结果
              </button>

              <div className={styles.formHint}>
                保存后会同步更新公开实验室前台，并保留状态历史。
              </div>

            <div className={styles.quickLinks}>
              <Link href={`/lab/idea/${selectedIdea.slug}`}>打开公开页</Link>
              {relatedFeatures[0] ? (
                <Link href={getFeatureIdeaPublicHref(relatedFeatures[0]) || '/lab'}>查看关联前台</Link>
              ) : null}
            </div>
          </form>
          ) : (
            <div className={styles.emptyState}>当前没有可操作的 Idea。</div>
          )}
        </aside>
      </section>
    </AdminShell>
  )
}
