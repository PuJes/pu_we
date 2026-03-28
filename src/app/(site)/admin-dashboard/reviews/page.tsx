import Link from 'next/link'

import AdminShell from '../_components/AdminShell'
import {
  bulkReviewCommentsAction,
  bulkUpdateFeaturesAction,
  reviewCommentAction,
  updateFeatureAction,
} from '../actions'
import {
  formatAdminEvent,
  formatDateTime,
  formatFeatureStatus,
  formatCommentStatus,
  getCommentAuthor,
  getFeatureIdeaAdminHref,
  getFeatureIdeaPublicHref,
  getFeatureIdeaTitle,
  getReviewQueueData,
  parseReviewCommentTargetFilter,
  parseReviewFeatureStatusFilter,
  parseReviewKind,
  parseReviewQueueFilter,
  parseReviewUpdatedFilter,
  parseSearchQuery,
  parseSelectedId,
} from '../lib'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function buildPath(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value)
    }
  })

  const query = search.toString()
  return query ? `/admin-dashboard/reviews?${query}` : '/admin-dashboard/reviews'
}

export default async function AdminDashboardReviewsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const queue = parseReviewQueueFilter(getParam(params.queue))
  const kind = parseReviewKind(getParam(params.kind))
  const itemId = parseSelectedId(getParam(params.itemId))
  const query = parseSearchQuery(getParam(params.q))
  const updated = parseReviewUpdatedFilter(getParam(params.updated))
  const featureStatus = parseReviewFeatureStatusFilter(getParam(params.featureStatus))
  const commentTarget = parseReviewCommentTargetFilter(getParam(params.commentTarget))
  const notice = getParam(params.notice)
  const tone = getParam(params.tone) === 'error' ? 'error' : 'success'

  const {
    comments,
    features,
    selectedKind,
    selectedComment,
    selectedFeature,
    selectedCommentTarget,
    selectedActivity,
  } = await getReviewQueueData({
    queue,
    kind,
    itemId,
    query,
    updated,
    featureStatus,
    commentTarget,
  })

  const baseParams = {
    queue: queue === 'all' ? undefined : queue,
    q: query || undefined,
    updated: updated === 'all' ? undefined : updated,
    featureStatus: featureStatus === 'all' ? undefined : featureStatus,
    commentTarget: commentTarget === 'all' ? undefined : commentTarget,
  }

  const selectedPath = buildPath({
    ...baseParams,
    kind: selectedKind || undefined,
    itemId:
      selectedKind === 'comment'
        ? selectedComment
          ? String(selectedComment.id)
          : undefined
        : selectedFeature
          ? String(selectedFeature.id)
          : undefined,
  })

  const selectedCommentIndex = selectedComment
    ? comments.findIndex((item) => item.id === selectedComment.id)
    : -1
  const selectedFeatureIndex = selectedFeature
    ? features.findIndex((item) => item.id === selectedFeature.id)
    : -1

  const nextComment = selectedCommentIndex >= 0 ? comments[selectedCommentIndex + 1] : null
  const nextFeature = selectedFeatureIndex >= 0 ? features[selectedFeatureIndex + 1] : null

  const nextPath =
    selectedKind === 'comment'
      ? nextComment
        ? buildPath({ ...baseParams, kind: 'comment', itemId: String(nextComment.id) })
        : features.length > 0
          ? buildPath({ ...baseParams, kind: 'feature', itemId: String(features[0].id) })
          : buildPath({ ...baseParams })
      : selectedKind === 'feature'
        ? nextFeature
          ? buildPath({ ...baseParams, kind: 'feature', itemId: String(nextFeature.id) })
          : comments.length > 0
            ? buildPath({ ...baseParams, kind: 'comment', itemId: String(comments[0].id) })
            : buildPath({ ...baseParams })
        : buildPath({ ...baseParams })

  return (
    <AdminShell
      active="reviews"
      currentPath={selectedPath}
      title="审核队列"
      description="评论审核和功能建议都在同一页里处理。先看上下文，再决定公开、驳回、采纳还是完成。"
      notice={notice || undefined}
      tone={tone}
      actions={
        <div className={styles.actions}>
          <Link className={styles.secondaryLink} href="/admin-dashboard/triage">
            去 Idea 分诊台
          </Link>
        </div>
      }
    >
      <section className={styles.filters}>
        <form className={styles.searchForm} action="/admin-dashboard/reviews" method="get">
          <input type="hidden" name="queue" value={queue === 'all' ? '' : queue} />
          <input type="hidden" name="updated" value={updated === 'all' ? '' : updated} />
          <input type="hidden" name="featureStatus" value={featureStatus === 'all' ? '' : featureStatus} />
          <input type="hidden" name="commentTarget" value={commentTarget === 'all' ? '' : commentTarget} />
          <input
            className={styles.searchInput}
            type="search"
            name="q"
            defaultValue={query}
            placeholder="搜索评论、建议或关键词"
          />
          <button className={styles.searchButton} type="submit">
            搜索
          </button>
        </form>
        <Link
          href={buildPath({ ...baseParams, kind: selectedKind || undefined, itemId: getParam(params.itemId) || undefined })}
          className={queue === 'all' ? styles.activeFilter : styles.filterLink}
        >
          全部
        </Link>
        <Link
          href={buildPath({
            queue: 'comments',
            q: query || undefined,
            updated: updated === 'all' ? undefined : updated,
            commentTarget: commentTarget === 'all' ? undefined : commentTarget,
            kind: selectedKind === 'comment' ? 'comment' : undefined,
            itemId: selectedKind === 'comment' ? getParam(params.itemId) || undefined : undefined,
          })}
          className={queue === 'comments' ? styles.activeFilter : styles.filterLink}
        >
          仅评论
        </Link>
        <Link
          href={buildPath({
            queue: 'features',
            q: query || undefined,
            updated: updated === 'all' ? undefined : updated,
            featureStatus: featureStatus === 'all' ? undefined : featureStatus,
            kind: selectedKind === 'feature' ? 'feature' : undefined,
            itemId: selectedKind === 'feature' ? getParam(params.itemId) || undefined : undefined,
          })}
          className={queue === 'features' ? styles.activeFilter : styles.filterLink}
        >
          仅功能建议
        </Link>
        <div className={styles.filterGroup}>
          {(['all', '24h', '7d', 'stale'] as const).map((item) => (
            <Link
              key={item}
              href={buildPath({
                ...baseParams,
                updated: item === 'all' ? undefined : item,
                kind: selectedKind || undefined,
                itemId: selectedKind === 'comment' && selectedComment ? String(selectedComment.id) : selectedKind === 'feature' && selectedFeature ? String(selectedFeature.id) : undefined,
              })}
              className={updated === item ? styles.activeFilter : styles.filterLink}
            >
              {item === 'all' ? '全部时间' : item === '24h' ? '24h 内' : item === '7d' ? '7 天内' : '超过 7 天'}
            </Link>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {(['all', 'idea', 'content', 'feature'] as const).map((item) => (
            <Link
              key={item}
              href={buildPath({
                ...baseParams,
                commentTarget: item === 'all' ? undefined : item,
                kind: selectedKind || undefined,
                itemId: selectedKind === 'comment' && selectedComment ? String(selectedComment.id) : undefined,
              })}
              className={commentTarget === item ? styles.activeFilter : styles.filterLink}
            >
              {item === 'all' ? '全部评论目标' : item.toUpperCase()}
            </Link>
          ))}
        </div>
        <div className={styles.filterGroup}>
          {(['all', 'open', 'planned', 'done'] as const).map((item) => (
            <Link
              key={item}
              href={buildPath({
                ...baseParams,
                featureStatus: item === 'all' ? undefined : item,
                kind: selectedKind || undefined,
                itemId: selectedKind === 'feature' && selectedFeature ? String(selectedFeature.id) : undefined,
              })}
              className={featureStatus === item ? styles.activeFilter : styles.filterLink}
            >
              {item === 'all' ? '全部功能状态' : formatFeatureStatus(item)}
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.queuePanel}>
          <div className={styles.panelHead}>
            <h2>待处理对象</h2>
            <span>{comments.length + features.length} 条</span>
          </div>

          {comments.length > 0 ? (
            <div className={styles.sectionGroup}>
              <h3>评论</h3>
              <div className={styles.queueList}>
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={
                      selectedKind === 'comment' && selectedComment?.id === comment.id
                        ? styles.activeQueueItem
                        : styles.queueItem
                    }
                  >
                    <input
                      className={styles.queueCheckbox}
                      type="checkbox"
                      name="commentIds"
                      value={comment.id}
                      form="bulk-comments-form"
                      aria-label={`选择评论 ${comment.id}`}
                    />
                    <Link
                      href={buildPath({
                        ...baseParams,
                        kind: 'comment',
                        itemId: String(comment.id),
                      })}
                      className={styles.queueLink}
                    >
                      <div className={styles.queueHead}>
                        <strong>{getCommentAuthor(comment)}</strong>
                        <span>{comment.targetType.toUpperCase()}</span>
                      </div>
                      <p>{comment.content}</p>
                      <div className={styles.queueMeta}>
                        <span>{formatDateTime(comment.createdAt)}</span>
                        <span>{comment.upvotes} 顶</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div className={styles.sectionGroup}>
              <h3>功能建议</h3>
              <div className={styles.queueList}>
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={
                      selectedKind === 'feature' && selectedFeature?.id === feature.id
                        ? styles.activeQueueItem
                        : styles.queueItem
                    }
                  >
                    <input
                      className={styles.queueCheckbox}
                      type="checkbox"
                      name="featureIds"
                      value={feature.id}
                      form="bulk-features-form"
                      aria-label={`选择功能建议 ${feature.id}`}
                    />
                    <Link
                      href={buildPath({
                        ...baseParams,
                        kind: 'feature',
                        itemId: String(feature.id),
                      })}
                      className={styles.queueLink}
                    >
                      <div className={styles.queueHead}>
                        <strong>{getFeatureIdeaTitle(feature)}</strong>
                        <span>{formatFeatureStatus(feature.status)}</span>
                      </div>
                      <p>{feature.content}</p>
                      <div className={styles.queueMeta}>
                        <span>{feature.voteCount} 支持</span>
                        <span>{formatDateTime(feature.updatedAt)}</span>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {comments.length + features.length === 0 ? (
            <div className={styles.emptyState}>当前筛选条件下没有待处理对象。</div>
          ) : null}
        </aside>

        <section className={styles.detailPanel}>
          {selectedKind === 'comment' && selectedComment ? (
            <>
              <article className={styles.heroCard}>
                <div>
                  <small>当前审核对象</small>
                  <h2>评论审核</h2>
                  <p>{selectedComment.content}</p>
                </div>
                <div className={styles.heroMeta}>
                  <span>{getCommentAuthor(selectedComment)}</span>
                  <span>{formatCommentStatus(selectedComment.status)}</span>
                  <span>{formatDateTime(selectedComment.createdAt)}</span>
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.panelHead}>
                  <h3>评论上下文</h3>
                  <span>{selectedComment.targetType.toUpperCase()}</span>
                </div>
                <div className={styles.contextGrid}>
                  <div className={styles.contextItem}>
                    <small>目标对象</small>
                    <strong>{selectedCommentTarget?.label || `#${selectedComment.targetId}`}</strong>
                    {selectedCommentTarget?.secondary ? <p>{selectedCommentTarget.secondary}</p> : null}
                  </div>
                  <div className={styles.contextItem}>
                    <small>操作入口</small>
                    <div className={styles.linkRow}>
                      {selectedCommentTarget?.adminHref ? (
                        <Link href={selectedCommentTarget.adminHref}>跳到后台对象</Link>
                      ) : null}
                      {selectedCommentTarget?.publicHref ? (
                        <Link href={selectedCommentTarget.publicHref}>打开公开页</Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
              <article className={styles.panelCard}>
                <div className={styles.panelHead}>
                  <h3>后台操作记录</h3>
                  <span>{selectedActivity?.length || 0} 条</span>
                </div>
                {selectedActivity && selectedActivity.length > 0 ? (
                  <div className={styles.timeline}>
                    {selectedActivity.map((item) => (
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
              </article>
            </>
          ) : null}

          {selectedKind === 'feature' && selectedFeature ? (
            <>
              <article className={styles.heroCard}>
                <div>
                  <small>当前处理对象</small>
                  <h2>{getFeatureIdeaTitle(selectedFeature)}</h2>
                  <p>{selectedFeature.content}</p>
                </div>
                <div className={styles.heroMeta}>
                  <span>{formatFeatureStatus(selectedFeature.status)}</span>
                  <span>{selectedFeature.voteCount} 支持</span>
                  <span>{formatDateTime(selectedFeature.updatedAt)}</span>
                </div>
              </article>

              <article className={styles.panelCard}>
                <div className={styles.panelHead}>
                  <h3>功能建议上下文</h3>
                  <span>关联 Idea</span>
                </div>
                <div className={styles.contextGrid}>
                  <div className={styles.contextItem}>
                    <small>所属 Idea</small>
                    <strong>{getFeatureIdeaTitle(selectedFeature)}</strong>
                    <div className={styles.linkRow}>
                      {getFeatureIdeaAdminHref(selectedFeature) ? (
                        <Link href={getFeatureIdeaAdminHref(selectedFeature)!}>跳到分诊台</Link>
                      ) : null}
                      {getFeatureIdeaPublicHref(selectedFeature) ? (
                        <Link href={getFeatureIdeaPublicHref(selectedFeature)!}>打开公开页</Link>
                      ) : null}
                    </div>
                  </div>
                  <div className={styles.contextItem}>
                    <small>当前 Builder Reply</small>
                    <p>{selectedFeature.builderReply || '当前还没有 Builder 回复。'}</p>
                  </div>
                </div>
              </article>
              <article className={styles.panelCard}>
                <div className={styles.panelHead}>
                  <h3>后台操作记录</h3>
                  <span>{selectedActivity?.length || 0} 条</span>
                </div>
                {selectedActivity && selectedActivity.length > 0 ? (
                  <div className={styles.timeline}>
                    {selectedActivity.map((item) => (
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
              </article>
            </>
          ) : null}

          {!selectedKind ? <div className={styles.emptyCanvas}>先从左侧选一个评论或功能建议开始处理。</div> : null}
        </section>

        <aside className={styles.actionPanel}>
          {selectedKind === 'comment' && selectedComment ? (
            <form action={reviewCommentAction} className={styles.actionForm}>
              <input type="hidden" name="commentId" value={selectedComment.id} />
              <input type="hidden" name="returnTo" value={nextPath} />

              <div className={styles.formSection}>
                <h3>评论审核</h3>
                <label>
                  <span>审核结果</span>
                  <select name="status" defaultValue="approved">
                    <option value="approved">通过并公开</option>
                    <option value="rejected">驳回</option>
                  </select>
                </label>

                <label>
                  <span>审核说明</span>
                  <textarea
                    name="reviewReason"
                    rows={6}
                    defaultValue={selectedComment.reviewReason || ''}
                    placeholder="说明为什么通过，或为什么驳回。"
                  />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="reviewReasonPublic"
                    defaultChecked={selectedComment.reviewReasonPublic || false}
                  />
                  <span>审核原因可公开展示</span>
                </label>
              </div>

              <button className={styles.primaryButton} type="submit">
                保存评论审核结果
              </button>
            </form>
          ) : null}

          {selectedKind === 'feature' && selectedFeature ? (
            <form action={updateFeatureAction} className={styles.actionForm}>
              <input type="hidden" name="featureId" value={selectedFeature.id} />
              <input type="hidden" name="returnTo" value={nextPath} />

              <div className={styles.formSection}>
                <h3>功能建议处理</h3>
                <label>
                  <span>状态</span>
                  <select name="status" defaultValue={selectedFeature.status}>
                    <option value="open">保持开放</option>
                    <option value="planned">采纳为 planned</option>
                    <option value="done">标记为 done</option>
                  </select>
                </label>

                <label>
                  <span>Builder Reply</span>
                  <textarea
                    name="builderReply"
                    rows={6}
                    defaultValue={selectedFeature.builderReply || ''}
                    placeholder="告诉共创者你会怎么处理，或者为什么现在不做。"
                  />
                </label>

                <label>
                  <span>状态说明</span>
                  <textarea
                    name="statusChangeReason"
                    rows={5}
                    defaultValue={selectedFeature.statusChangeReason || ''}
                    placeholder="记录采纳原因、交付说明，或当前阻塞。"
                  />
                </label>
              </div>

              <button className={styles.primaryButton} type="submit">
                保存功能处理结果
              </button>
            </form>
          ) : null}

          <form id="bulk-comments-form" action={bulkReviewCommentsAction} className={styles.actionForm}>
            <input type="hidden" name="returnTo" value={selectedPath} />
            <div className={styles.formSection}>
              <h3>批量处理评论</h3>
              <label>
                <span>统一审核结果</span>
                <select name="status" defaultValue="approved">
                  <option value="approved">通过并公开</option>
                  <option value="rejected">驳回</option>
                </select>
              </label>
              <label>
                <span>统一审核说明</span>
                <textarea
                  name="reviewReason"
                  rows={4}
                  placeholder="可选：批量处理原因说明。"
                />
              </label>
              <label className={styles.checkboxRow}>
                <input type="checkbox" name="reviewReasonPublic" defaultChecked={false} />
                <span>审核原因可公开展示</span>
              </label>
              <button className={styles.secondaryButton} type="submit">
                批量保存评论审核
              </button>
            </div>
          </form>

          <form id="bulk-features-form" action={bulkUpdateFeaturesAction} className={styles.actionForm}>
            <input type="hidden" name="returnTo" value={selectedPath} />
            <div className={styles.formSection}>
              <h3>批量处理功能建议</h3>
              <label>
                <span>统一状态</span>
                <select name="status" defaultValue="open">
                  <option value="open">保持开放</option>
                  <option value="planned">采纳为 planned</option>
                  <option value="done">标记为 done</option>
                </select>
              </label>
              <label>
                <span>统一 Builder Reply</span>
                <textarea
                  name="builderReply"
                  rows={4}
                  placeholder="可选：批量处理时的一致性回应。"
                />
              </label>
              <label>
                <span>统一状态说明</span>
                <textarea
                  name="statusChangeReason"
                  rows={4}
                  placeholder="记录采纳原因、交付说明或阻塞原因。"
                />
              </label>
              <button className={styles.secondaryButton} type="submit">
                批量保存功能处理
              </button>
            </div>
          </form>
        </aside>
      </section>
    </AdminShell>
  )
}
