import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CommentForm } from '@/components/forms/CommentForm'
import { getContentBySlug } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

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

  return (
    <main className="page-shell">
      <article className={styles.article}>
        <p className={styles.meta}>
          {content.category} · {content.type} · {(content.publishedAt || '').slice(0, 10)}
        </p>
        <h1 className={styles.title}>{content.title}</h1>
        {content.snippet ? <p className={styles.lead}>{content.snippet}</p> : null}

        {content.keyArgument ? (
          <section className={styles.block}>
            <h2>Key Argument</h2>
            <p>{content.keyArgument}</p>
          </section>
        ) : null}

        {content.analysisFramework ? (
          <section className={styles.block}>
            <h2>Analysis Framework</h2>
            <p>{content.analysisFramework}</p>
          </section>
        ) : null}

        <section className={styles.body}>
          {(content.articleBody || '')
            .split(/\n+/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={`${content.slug}-p-${index}`}>{paragraph}</p>
            ))}
          {!content.articleBody ? (
            <p>这篇内容已发布，正文将在下一轮内容同步中补充。</p>
          ) : null}
        </section>

        <div className={styles.tags}>
          {(content.tags || []).map((tag, index) => (
            <span key={`${content.slug}-tag-${index}`}>#{tag.tag}</span>
          ))}
        </div>

        <div className={styles.actions}>
          <Link href="/subscribe">☕ 请我喝杯咖啡</Link>
          <Link href="/lab">进入公开实验室</Link>
        </div>
      </article>

      <section className={styles.commentBox}>
        <CommentForm targetType="content" targetId={String(content.id)} />
      </section>
    </main>
  )
}
