import Link from 'next/link'

import AdminShell from '../_components/AdminShell'
import { reviewCommentAction, updateFeatureAction } from '../actions'
import {
  formatDateTime,
  formatFeatureStatus,
  formatCommentStatus,
  getCommentAuthor,
  getFeatureIdeaAdminHref,
  getFeatureIdeaPublicHref,
  getFeatureIdeaTitle,
  getReviewQueueData,
  parseReviewKind,
  parseReviewQueueFilter,
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
  const notice = getParam(params.notice)
  const tone = getParam(params.tone) === 'error' ? 'error' : 'success'

  const {
    comments,
    features,
    selectedKind,
    selectedComment,
    selectedFeature,
    selectedCommentTarget,
  } = await getReviewQueueData({
    queue,
    kind,
    itemId,
  })

  const selectedPath = buildPath({
    queue: queue === 'all' ? undefined : queue,
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

  return (
    <AdminShell
      active="reviews"
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
        <Link
          href={buildPath({ kind: selectedKind || undefined, itemId: getParam(params.itemId) || undefined })}
          className={queue === 'all' ? styles.activeFilter : styles.filterLink}
        >
          全部
        </Link>
        <Link
          href={buildPath({
            queue: 'comments',
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
            kind: selectedKind === 'feature' ? 'feature' : undefined,
            itemId: selectedKind === 'feature' ? getParam(params.itemId) || undefined : undefined,
          })}
          className={queue === 'features' ? styles.activeFilter : styles.filterLink}
        >
          仅功能建议
        </Link>
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
                  <Link
                    key={comment.id}
                    href={buildPath({
                      queue: queue === 'all' ? undefined : queue,
                      kind: 'comment',
                      itemId: String(comment.id),
                    })}
                    className={
                      selectedKind === 'comment' && selectedComment?.id === comment.id
                        ? styles.activeQueueItem
                        : styles.queueItem
                    }
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
                ))}
              </div>
            </div>
          ) : null}

          {features.length > 0 ? (
            <div className={styles.sectionGroup}>
              <h3>功能建议</h3>
              <div className={styles.queueList}>
                {features.map((feature) => (
                  <Link
                    key={feature.id}
                    href={buildPath({
                      queue: queue === 'all' ? undefined : queue,
                      kind: 'feature',
                      itemId: String(feature.id),
                    })}
                    className={
                      selectedKind === 'feature' && selectedFeature?.id === feature.id
                        ? styles.activeQueueItem
                        : styles.queueItem
                    }
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
            </>
          ) : null}

          {!selectedKind ? <div className={styles.emptyCanvas}>先从左侧选一个评论或功能建议开始处理。</div> : null}
        </section>

        <aside className={styles.actionPanel}>
          {selectedKind === 'comment' && selectedComment ? (
            <form action={reviewCommentAction} className={styles.actionForm}>
              <input type="hidden" name="commentId" value={selectedComment.id} />
              <input type="hidden" name="returnTo" value={selectedPath} />

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
              </div>

              <button className={styles.primaryButton} type="submit">
                保存评论审核结果
              </button>
            </form>
          ) : null}

          {selectedKind === 'feature' && selectedFeature ? (
            <form action={updateFeatureAction} className={styles.actionForm}>
              <input type="hidden" name="featureId" value={selectedFeature.id} />
              <input type="hidden" name="returnTo" value={selectedPath} />

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
        </aside>
      </section>
    </AdminShell>
  )
}
