import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentForm } from '@/components/forms/CommentForm'
import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { RichTextRenderer } from '@/components/ui/RichTextRenderer'
import { getCommentsByTarget, getContentBySlug } from '@/lib/data/queries'
import { getCommentDisplayName } from '@/lib/domain/comment-authors'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

function getActive(category: string): 'ai' | 'analysis' | 'story' | undefined {
  if (category === 'ai-experiments') return 'ai'
  if (category === 'business-analysis') return 'analysis'
  if (category === 'my-story') return 'story'
  return undefined
}

function categoryLabel(category: string): string {
  if (category === 'ai-experiments') return 'AI 经验'
  if (category === 'business-analysis') return '商业分析'
  if (category === 'my-story') return '我的故事'
  return category
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const content = await getContentBySlug(slug)
  if (!content) {
    return { title: '文章未找到 — JESS.PU' }
  }
  return {
    title: `${content.title} — JESS.PU`,
    description: content.snippet || content.keyArgument || `${categoryLabel(content.category)} · ${content.title}`,
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const content = await getContentBySlug(slug)

  if (!content) {
    notFound()
  }

  const comments = await getCommentsByTarget('content', String(content.id))

  const sourceIdeaHref =
    content.sourceIdea && typeof content.sourceIdea === 'object' && content.sourceIdea.slug
      ? `/lab/idea/${content.sourceIdea.slug}`
      : null

  const hasRichBody = content.body?.root?.children && content.body.root.children.length > 0
  const hasPlainBody = Boolean(content.articleBody)

  return (
    <>
      <FigmaTopNav active={getActive(content.category)} />
      <main className="page-shell">
        <article className={styles.article}>
          <p className={styles.meta}>
            {categoryLabel(content.category)} · {content.type} · {(content.publishedAt || '').slice(0, 10)}
          </p>
          <h1 className={styles.title}>{content.title}</h1>
          {content.snippet ? <p className={styles.lead}>{content.snippet}</p> : null}

          {content.externalLink ? (
            <a
              href={content.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              🔗 阅读原文（外部平台） →
            </a>
          ) : null}

          {content.keyArgument ? (
            <section className={styles.block}>
              <h2>核心论点</h2>
              <p>{content.keyArgument}</p>
            </section>
          ) : null}

          {content.analysisFramework ? (
            <section className={styles.block}>
              <h2>分析框架</h2>
              <p>{content.analysisFramework}</p>
            </section>
          ) : null}

          {content.takeaways && content.takeaways.length > 0 ? (
            <section className={styles.block}>
              <h2>关键收获</h2>
              <ul className={styles.takeawayList}>
                {content.takeaways.map((t, i) => (
                  <li key={`takeaway-${i}`}>{t.item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {content.sourceIdea || content.sourceFeature ? (
            <section className={styles.block}>
              <h2>来源共创</h2>
              <div className={styles.sources}>
                {content.sourceIdea ? (
                  sourceIdeaHref ? <Link href={sourceIdeaHref}>查看来源 Idea</Link> : <span className={styles.sourceTag}>关联了来源 Idea</span>
                ) : null}
                {content.sourceFeature ? (
                  <span className={styles.sourceTag}>关联 Feature：{typeof content.sourceFeature === 'string' ? content.sourceFeature : content.sourceFeature.id}</span>
                ) : null}
              </div>
              {content.contributorThanks ? <p className={styles.contributorThanks}>{content.contributorThanks}</p> : null}
            </section>
          ) : null}

          {/* 正文区域：优先 Lexical RichText，降级到纯文本 */}
          <section className={styles.body}>
            {hasRichBody ? (
              <RichTextRenderer content={content.body as Parameters<typeof RichTextRenderer>[0]['content']} />
            ) : hasPlainBody ? (
              (content.articleBody || '')
                .split(/\n+/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`${content.slug}-p-${index}`}>{paragraph}</p>
                ))
            ) : (
              <p className={styles.emptyBody}>
                {content.externalLink
                  ? '这篇内容暂无站内正文，请点击上方按钮查看原始内容。'
                  : '正文将在下一轮内容同步中补充。'}
              </p>
            )}
          </section>

          <div className={styles.tags}>
            {(content.tags || []).map((tag, index) => (
              <span key={`${content.slug}-tag-${index}`}>#{tag.tag}</span>
            ))}
          </div>

          <div className={styles.tipBar}>
            <p>☕️ 如果这篇内容帮到了你，欢迎请我喝杯咖啡支持创作。</p>
            <div className={styles.actions}>
              <Link href="/subscribe" className={styles.tipAction}>☕ 请我喝杯咖啡</Link>
              <Link href="/lab">进入公开实验室</Link>
            </div>
          </div>
        </article>

        <section className={styles.commentBox}>
          <h3 className={styles.commentTitle}>评论 ({comments.length})</h3>

          {comments.length > 0 ? (
            <div className={styles.commentList}>
                  {comments.map((c) => (
                    <article key={c.id} className={styles.commentItem}>
                      <div className={styles.commentMeta}>
                        <strong>@{getCommentDisplayName(c)}</strong>
                        {c.createdAt ? <time>{c.createdAt.slice(0, 10)}</time> : null}
                      </div>
                  <p>{c.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.commentEmpty}>暂无评论，来说说你的想法吧。</p>
          )}

          <CommentForm targetType="content" targetId={String(content.id)} />
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
