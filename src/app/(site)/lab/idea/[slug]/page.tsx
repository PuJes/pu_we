import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentForm } from '@/components/forms/CommentForm'
import { FeatureSubmitForm } from '@/components/forms/FeatureSubmitForm'
import { VoteButton } from '@/components/forms/VoteButton'
import { IdeaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getCommentDisplayName } from '@/lib/domain/comment-authors'
import { getIdeaDetail, type CommentDoc, type ContentDoc, type PublicFeatureDoc } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const detail = await getIdeaDetail(slug)

  if (!detail) {
    notFound()
  }

  const { idea, features, comments, linkedContents } = detail
  const statusLabelMap: Record<string, string> = {
    pending: '待澄清',
    discussing: '讨论中',
    approved: '已立项',
    'in-progress': '开发中',
    launched: '已上线',
    reviewed: '已复盘',
  }
  const statusFlagMap: Record<string, string> = {
    pending: '💡 亟需验证/共鸣征集',
    discussing: '💬 Builder 正在评估中',
    approved: '✅ 已进入立项队列',
    'in-progress': '🛠 正在公开构建',
    launched: '🚀 已交付，欢迎体验',
    reviewed: '📝 已复盘，查看成果',
  }

  const statusTimeline = (
    (idea.statusHistory as Array<{
      fromStatus: string
      toStatus: string
      changedAt: string
      changedBy: string
      reason?: string
    }> | undefined) || []
  )
    .slice()
    .reverse()
    .slice(0, 6)
  const featureList = features as PublicFeatureDoc[]

  const contributorSet = new Set<string>()
  for (const feature of featureList) {
    if (feature.author && typeof feature.author === 'object') {
      contributorSet.add(feature.author.nickname || feature.author.email || '共创者')
    }
  }
  for (const comment of comments as CommentDoc[]) {
    contributorSet.add(getCommentDisplayName(comment))
  }
  const contributors = Array.from(contributorSet).slice(0, 12)
  const deliveryContents = linkedContents as ContentDoc[]
  const shouldShowDelivery = idea.status === 'reviewed' || deliveryContents.length > 0

  return (
    <>
      <IdeaTopNav />
      <main className={styles.page}>
        <div className={`page-shell ${styles.shell}`}>
          <header className={styles.header}>
            <p className={styles.breadcrumb}>
              <Link href="/lab">Idea 广场</Link> / 脑暴与共创
            </p>
            <span className={styles.flag}>
              {statusFlagMap[idea.status] || `📌 当前状态：${statusLabelMap[idea.status] || idea.status}`}
            </span>
            <h1 className={styles.title}>{idea.title}</h1>
            <p className={styles.subtitle}>{idea.description}</p>
            <div className={styles.metaRow}>
              <span className={styles.metaTag}>当前阶段：{statusLabelMap[idea.status] || idea.status}</span>
              {idea.targetVersion ? <span className={styles.metaTag}>预计版本：{idea.targetVersion}</span> : null}
              {idea.lastBuilderUpdateAt ? (
                <span className={styles.metaTag}>最近更新：{idea.lastBuilderUpdateAt.slice(0, 10)}</span>
              ) : null}
            </div>
          </header>

          <section className={styles.mainGrid}>
            <aside className={styles.leftCol}>
              <article className={styles.pathGuide}>
                <h4>参与路径说明</h4>
                <p>
                  <strong>路径 A：</strong>讨论 Idea 层问题（是否值得做、目标用户是谁、优先级如何）。
                </p>
                <p>
                  <strong>路径 B：</strong>提交 Feature 细节（具体交互、约束、接口、验收标准）。
                </p>
              </article>

              <article className={styles.timelineCard}>
                <h4>生命周期时间线</h4>
                <div className={styles.timelineList}>
                  {statusTimeline.length === 0 ? (
                    <p className={styles.empty}>暂无状态变更记录。</p>
                  ) : (
                    statusTimeline.map((item, index) => (
                      <article key={`${item.changedAt}-${index}`} className={styles.timelineItem}>
                        <b>
                          {statusLabelMap[item.fromStatus] || item.fromStatus} →{' '}
                          {statusLabelMap[item.toStatus] || item.toStatus}
                        </b>
                        <span>
                          {item.changedAt.slice(0, 10)} · {item.changedBy}
                        </span>
                        {item.reason ? <p>{item.reason}</p> : null}
                      </article>
                    ))
                  )}
                </div>
              </article>

              {/* Builder Log 造物日志 */}
              <article className={styles.timelineCard}>
                <h4>🛠 Builder 造物日志</h4>
                <div className={styles.timelineList}>
                  {(idea.builderLogs || []).length === 0 ? (
                    <p className={styles.empty}>
                      {idea.status === 'pending' || idea.status === 'discussing'
                        ? 'Builder 还在观察这个灵感的潜力，快用投票砸醒他！'
                        : '暂无开发日志。'}
                    </p>
                  ) : (
                    (idea.builderLogs || []).map((log, index) => (
                      <article key={`log-${index}`} className={styles.timelineItem}>
                        <b>
                          👩‍💻 {log.version ? `${log.version} · ` : ''}
                          {log.date.slice(0, 10)}
                        </b>
                        <p>{log.content}</p>
                      </article>
                    ))
                  )}
                </div>
              </article>

              {shouldShowDelivery ? (
                <article className={styles.deliveryCard}>
                  <h4>成果交付</h4>
                  {deliveryContents.length === 0 ? (
                    <p className={styles.empty}>这条 Idea 已进入复盘阶段，成果内容正在整理发布中。</p>
                  ) : (
                    <div className={styles.deliveryList}>
                      {deliveryContents.map((content) => {
                        const href = content.externalLink || `/post/${content.slug}`
                        const meta = [
                          content.category || 'content',
                          content.type || 'article',
                          content.publishedAt ? content.publishedAt.slice(0, 10) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                        const cardBody = (
                          <>
                            <span className={styles.deliveryMeta}>{meta}</span>
                            <strong>{content.title}</strong>
                            {content.snippet ? <p>{content.snippet}</p> : null}
                          </>
                        )

                        return content.externalLink ? (
                          <a
                            key={content.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.deliveryItem}
                          >
                            {cardBody}
                          </a>
                        ) : (
                          <Link key={content.id} href={href} className={styles.deliveryItem}>
                            {cardBody}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </article>
              ) : null}

              <article className={styles.recruit} id="contribute">
                <h4>共创者招募</h4>
                <p>如果你对这个项目有兴趣，欢迎通过评论区或邮件参与讨论和共创。</p>
                <Link href="/subscribe">了解更多联系方式 →</Link>
              </article>

              <article className={styles.tipCard}>
                <p>☕️ 如果这个项目帮到了你，欢迎请我喝杯咖啡支持创作。</p>
                <Link href="/subscribe">打赏支持 →</Link>
              </article>
            </aside>

            <section className={styles.rightCol}>
              <div className={styles.discussionHead}>
                <h3>Idea 讨论与 Feature 提案区</h3>
                <a href="#feature-submit">提交便签</a>
              </div>
              <div className={styles.stickyBoard}>
                {featureList.slice(0, 5).map((feature, index) => (
                  <article key={feature.id} className={styles[`sticky${(index % 5) + 1}` as keyof typeof styles]}>
                    <div className={styles.stickyMeta}>
                      <span>{feature.status || 'open'}</span>
                      {feature.isAdopted ? <strong>已采纳</strong> : null}
                    </div>
                    <p>{feature.content}</p>
                    <div className={styles.stickyFooter}>
                      <span>#{index + 1}</span>
                      <VoteButton featureId={String(feature.id)} initialCount={feature.voteCount || 0} compact />
                    </div>
                    {feature.builderReply ? <em className={styles.reply}>Builder: {feature.builderReply}</em> : null}
                  </article>
                ))}
                <article className={styles.emptySticky}>还没有公开便签，先在下方提交第一条 Feature 建议。</article>
              </div>
              <div className={styles.formArea} id="feature-submit">
                <FeatureSubmitForm ideaId={String(idea.id)} />
                <CommentForm targetType="idea" targetId={String(idea.id)} />
              </div>

              <section className={styles.commentPanel}>
                <h4>已审核评论</h4>
                <div className={styles.commentList}>
                  {(comments as CommentDoc[]).map((item) => (
                    <article key={item.id}>
                      <b>@{getCommentDisplayName(item)}</b>
                      <p>{item.content}</p>
                    </article>
                  ))}
                  {comments.length === 0 ? <p className={styles.empty}>暂时还没有评论。</p> : null}
                </div>
              </section>

              <section className={styles.contributorPanel}>
                <h4>共创贡献者</h4>
                <div className={styles.contributorList}>
                  {contributors.length === 0 ? (
                    <p className={styles.empty}>当前还没有贡献者记录。</p>
                  ) : (
                    contributors.map((name, index) => (
                      <span key={`${name}-${index}`} className={styles.contributor}>
                        @{name}
                      </span>
                    ))
                  )}
                </div>
                {idea.status === 'reviewed' && idea.reviewedThankYouTemplate ? (
                  <p className={styles.thanks}>{idea.reviewedThankYouTemplate}</p>
                ) : null}
              </section>
            </section>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
