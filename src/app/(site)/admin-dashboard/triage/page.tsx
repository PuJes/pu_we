import type { ReactNode } from 'react'
import Link from 'next/link'

import AdminShell from '../_components/AdminShell'
import { linkIdeaContentAction, unlinkIdeaContentAction, updateIdeaAction } from '../actions'
import {
  formatBuilderLogVersion,
  formatCommentStatus,
  formatDateTime,
  formatFeatureStatus,
  formatIdeaStatus,
  type TriageStatusFilter,
  formatAdminEvent,
  getCommentAuthor,
  getFeatureIdeaPublicHref,
  getIdeaPriorityLabel,
  getIdeaTriageData,
  parseSearchQuery,
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
  query?: string
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

  if (params.query) {
    search.set('q', params.query)
  }

  const query = search.toString()
  return query ? `/admin-dashboard/triage?${query}` : '/admin-dashboard/triage'
}

function FoldPanel({
  title,
  caption,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  caption: string
  count: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details className={styles.foldPanel} open={defaultOpen}>
      <summary className={styles.foldSummary}>
        <div className={styles.foldHeading}>
          <strong>{title}</strong>
          <small>{caption}</small>
        </div>
        <span className={styles.foldCount}>{count}</span>
      </summary>
      <div className={styles.foldBody}>{children}</div>
    </details>
  )
}

export default async function AdminDashboardTriagePage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const status = parseTriageStatusFilter(getParam(params.status))
  const sort = parseTriageSort(getParam(params.sort))
  const ideaId = parseSelectedId(getParam(params.ideaId))
  const query = parseSearchQuery(getParam(params.q))
  const notice = getParam(params.notice)
  const tone = getParam(params.tone) === 'error' ? 'error' : 'success'

  const {
    ideas,
    selectedIdea,
    relatedFeatures,
    relatedComments,
    nextStatuses,
    linkedContents,
    contentOptions,
    adminActivity,
    priorityBreakdown,
  } =
    await getIdeaTriageData({
      ideaId,
      status,
      sort,
      query,
    })

  const selectedPath = buildPath({
    status: status === 'all' ? undefined : status,
    sort: sort === 'priority' ? undefined : sort,
    ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
    query: query || undefined,
  })

  const builderLogs =
    selectedIdea?.builderLogs && selectedIdea.builderLogs.length > 0
      ? [...selectedIdea.builderLogs].reverse().slice(0, 4)
      : []
  const statusHistory =
    selectedIdea?.statusHistory && selectedIdea.statusHistory.length > 0
      ? [...selectedIdea.statusHistory].reverse().slice(0, 4)
      : []
  const getContentSummary = (content: (typeof linkedContents)[number]) =>
    content.snippet || content.keyArgument || content.articleBody || content.contributorThanks || '暂无摘要。'

  return (
    <AdminShell
      active="triage"
      currentPath={selectedPath}
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
        <form className={styles.searchForm} action="/admin-dashboard/triage" method="get">
          <input type="hidden" name="status" value={status === 'all' ? '' : status} />
          <input type="hidden" name="sort" value={sort === 'priority' ? '' : sort} />
          <input type="hidden" name="ideaId" value={selectedIdea ? String(selectedIdea.id) : ''} />
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="搜索标题、描述或 slug"
          />
          <button className={styles.searchButton} type="submit">
            搜索
          </button>
        </form>
        <div className={styles.filterGroup}>
          {(['all', 'pending', 'discussing', 'approved', 'in-progress', 'launched', 'reviewed'] as const).map((item) => (
            <Link
              key={item}
              href={buildPath({
                status: item === 'all' ? undefined : item,
                sort: sort === 'priority' ? undefined : sort,
                ideaId: selectedIdea ? String(selectedIdea.id) : undefined,
                query: query || undefined,
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
              query: query || undefined,
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
              query: query || undefined,
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
                    query: query || undefined,
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

        <section className={styles.canvas}>
          {selectedIdea ? (
            <>
              <article className={styles.heroCard}>
                <div className={styles.heroHeader}>
                  <div className={styles.heroIntro}>
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
                </div>
                <div className={styles.summaryStrip}>
                  <article className={styles.summaryItem}>
                    <small>Impact</small>
                    <strong>{selectedIdea.impactScore || 0}</strong>
                  </article>
                  <article className={styles.summaryItem}>
                    <small>Effort</small>
                    <strong>{selectedIdea.effortScore || 0}</strong>
                  </article>
                  <article className={styles.summaryItem}>
                    <small>Reusability</small>
                    <strong>{selectedIdea.reusabilityScore || 0}</strong>
                  </article>
                  <article className={styles.summaryItem}>
                    <small>更新时间</small>
                    <strong>{formatDateTime(selectedIdea.updatedAt)}</strong>
                  </article>
                </div>
              </article>

              <div className={styles.mainGrid}>
                <div className={styles.primaryColumn}>
                  <article className={styles.panelCard}>
                    <div className={styles.panelHead}>
                      <h3>优先级拆解</h3>
                      <span>Priority Score</span>
                    </div>
                    {priorityBreakdown ? (
                      <div className={styles.priorityGrid}>
                        <div>
                          <small>票数权重</small>
                          <strong>{priorityBreakdown.weightedVotes}</strong>
                          <p>{priorityBreakdown.voteCount} 票 × {priorityBreakdown.multiplier}</p>
                        </div>
                        <div>
                          <small>业务价值</small>
                          <strong>{priorityBreakdown.weightedBusinessValue}</strong>
                          <p>Impact × 4 + Reuse × 2</p>
                        </div>
                        <div>
                          <small>投入惩罚</small>
                          <strong>-{priorityBreakdown.weightedEffortPenalty}</strong>
                          <p>Effort × 2</p>
                        </div>
                        <div>
                          <small>最终得分</small>
                          <strong>{priorityBreakdown.finalScore}</strong>
                          <p>由系统自动计算</p>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.emptyState}>当前还没有优先级拆解数据。</div>
                    )}
                  </article>

                  <FoldPanel
                    title="Builder Log"
                    caption="最近执行与判断"
                    count={`${builderLogs.length} 条`}
                    defaultOpen
                  >
                    {builderLogs.length > 0 ? (
                      <div className={styles.timeline}>
                        {builderLogs.map((item) => (
                          <div key={`${item.date}-${item.content}`} className={styles.timelineItem}>
                            <small>{formatDateTime(item.date)}</small>
                            <strong>{formatBuilderLogVersion(item.version)}</strong>
                            <p>{item.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>当前还没有 Builder Log。</div>
                    )}
                  </FoldPanel>

                  <FoldPanel title="状态流转" caption="为什么推进，为什么暂缓" count={`${statusHistory.length} 条`}>
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
                  </FoldPanel>

                  <FoldPanel
                    title="关联上下文"
                    caption="成果、功能建议与评论"
                    count={`${linkedContents.length + relatedFeatures.length + relatedComments.length} 项`}
                  >
                    <div className={styles.contextStack}>
                      <article className={styles.panelCard}>
                        <div className={styles.panelHead}>
                          <h3>成果回链</h3>
                          <span>{linkedContents.length} 条</span>
                        </div>
                        {linkedContents.length > 0 ? (
                          <div className={styles.stack}>
                            {linkedContents.map((content) => (
                              <div key={content.id} className={styles.inlineCard}>
                                <div className={styles.inlineCardHead}>
                                  <strong>{content.title}</strong>
                                  <span>{content.slug ? `/${content.slug}` : `#${content.id}`}</span>
                                </div>
                                <p>{getContentSummary(content)}</p>
                                <div className={styles.quickLinks}>
                                  {content.slug ? <Link href={`/post/${content.slug}`}>打开内容页</Link> : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.emptyState}>当前还没有回链成果内容。</div>
                        )}
                      </article>

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
                  </FoldPanel>

                  <FoldPanel title="后台操作记录" caption="最近运营动作" count={`${adminActivity.length} 条`}>
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
                      <div className={styles.emptyState}>还没有后台操作记录。</div>
                    )}
                  </FoldPanel>
                </div>

                <aside className={styles.controlRail}>
                  <div className={styles.stickyRail}>
                    <form action={updateIdeaAction} className={styles.actionForm}>
                      <input type="hidden" name="ideaId" value={selectedIdea.id} />
                      <input type="hidden" name="returnTo" value={selectedPath} />

                      <section className={styles.formCard}>
                        <div className={styles.formCardHead}>
                          <div>
                            <small>运营动作</small>
                            <h3>更新分诊结果</h3>
                          </div>
                          <span>保存后同步前台</span>
                        </div>

                        <details className={styles.formFold} open>
                          <summary className={styles.foldSummary}>
                            <div className={styles.foldHeading}>
                              <strong>推进状态</strong>
                              <small>状态、版本与推进原因</small>
                            </div>
                            <span className={styles.foldCount}>{formatIdeaStatus(selectedIdea.status)}</span>
                          </summary>
                          <div className={styles.foldBody}>
                            <div className={styles.formFields}>
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
                          </div>
                        </details>

                        <details className={styles.formFold}>
                          <summary className={styles.foldSummary}>
                            <div className={styles.foldHeading}>
                              <strong>优先级打分</strong>
                              <small>Impact / Effort / Reusability</small>
                            </div>
                            <span className={styles.foldCount}>得分 {selectedIdea.priorityScore || 0}</span>
                          </summary>
                          <div className={styles.foldBody}>
                            <div className={styles.scoreFieldGrid}>
                              <label>
                                <span>Impact</span>
                                <input
                                  type="number"
                                  name="impactScore"
                                  min="0"
                                  max="10"
                                  step="1"
                                  defaultValue={selectedIdea.impactScore || 0}
                                />
                              </label>
                              <label>
                                <span>Effort</span>
                                <input
                                  type="number"
                                  name="effortScore"
                                  min="0"
                                  max="10"
                                  step="1"
                                  defaultValue={selectedIdea.effortScore || 0}
                                />
                              </label>
                              <label>
                                <span>Reusability</span>
                                <input
                                  type="number"
                                  name="reusabilityScore"
                                  min="0"
                                  max="10"
                                  step="1"
                                  defaultValue={selectedIdea.reusabilityScore || 0}
                                />
                              </label>
                            </div>
                            <div className={styles.formHint}>
                              打分会影响 Priority Score 计算，可回看左侧拆解。
                            </div>
                          </div>
                        </details>

                        <details className={styles.formFold}>
                          <summary className={styles.foldSummary}>
                            <div className={styles.foldHeading}>
                              <strong>Builder Log 与复盘文案</strong>
                              <small>补充最新动作与感谢说明</small>
                            </div>
                            <span className={styles.foldCount}>新增记录</span>
                          </summary>
                          <div className={styles.foldBody}>
                            <div className={styles.formFields}>
                              <label>
                                <span>给共创者的感谢</span>
                                <textarea
                                  name="reviewedThankYouTemplate"
                                  rows={4}
                                  placeholder="这条复盘完成后要写给共创者的感谢或总结。"
                                  defaultValue={selectedIdea.reviewedThankYouTemplate || ''}
                                />
                              </label>
                              <div className={styles.fieldGrid}>
                                <label>
                                  <span>版本标签</span>
                                  <input type="text" name="builderLogVersion" placeholder="例如 v0.3-alpha" />
                                </label>
                                <label>
                                  <span>日志内容</span>
                                  <textarea
                                    name="builderLogContent"
                                    rows={5}
                                    placeholder="记录这次判断、阻塞点、实验结论或接下来要做什么。"
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </details>

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
                      </section>
                    </form>

                    <section className={styles.formCard}>
                      <div className={styles.formCardHead}>
                        <div>
                          <small>成果回链</small>
                          <h3>内容与复盘关联</h3>
                        </div>
                        <span>{linkedContents.length} 条已回链</span>
                      </div>

                      <details className={styles.formFold} open>
                        <summary className={styles.foldSummary}>
                          <div className={styles.foldHeading}>
                            <strong>关联成果内容</strong>
                            <small>把公开内容挂回这条 Idea</small>
                          </div>
                          <span className={styles.foldCount}>新增</span>
                        </summary>
                        <div className={styles.foldBody}>
                          <form action={linkIdeaContentAction} className={styles.inlineForm}>
                            <input type="hidden" name="ideaId" value={selectedIdea.id} />
                            <input type="hidden" name="returnTo" value={selectedPath} />
                            <label>
                              <span>选择内容</span>
                              <select name="contentId" defaultValue="">
                                <option value="">选择要回链的内容</option>
                                {contentOptions.map((content) => (
                                  <option key={content.id} value={content.id}>
                                    {content.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              <span>贡献致谢</span>
                              <textarea
                                name="contributorThanks"
                                rows={3}
                                placeholder="可选：补充作者致谢或协作说明。"
                              />
                            </label>
                            <button className={styles.secondaryButton} type="submit">
                              关联成果内容
                            </button>
                          </form>
                        </div>
                      </details>

                      <details className={styles.formFold}>
                        <summary className={styles.foldSummary}>
                          <div className={styles.foldHeading}>
                            <strong>已回链内容</strong>
                            <small>需要时可解除关联</small>
                          </div>
                          <span className={styles.foldCount}>{linkedContents.length} 条</span>
                        </summary>
                        <div className={styles.foldBody}>
                          {linkedContents.length > 0 ? (
                            <div className={styles.stack}>
                              {linkedContents.map((content) => (
                                <div key={content.id} className={styles.inlineRow}>
                                  <div>
                                    <strong>{content.title}</strong>
                                    <p>{content.slug ? `/${content.slug}` : `#${content.id}`}</p>
                                  </div>
                                  <form action={unlinkIdeaContentAction}>
                                    <input type="hidden" name="ideaId" value={selectedIdea.id} />
                                    <input type="hidden" name="contentId" value={content.id} />
                                    <input type="hidden" name="returnTo" value={selectedPath} />
                                    <button className={styles.ghostButton} type="submit">
                                      取消回链
                                    </button>
                                  </form>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.emptyState}>还没有已回链内容。</div>
                          )}
                        </div>
                      </details>
                    </section>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className={styles.emptyCanvas}>先从左侧选一条 Idea 开始分诊。</div>
          )}
        </section>
      </section>
    </AdminShell>
  )
}
