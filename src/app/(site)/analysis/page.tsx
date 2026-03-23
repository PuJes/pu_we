import type { Metadata } from 'next'
import Link from 'next/link'

import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getContentsByCategory } from '@/lib/data/queries'
import { ANALYSIS_TOPICS, makeTopicHref, matchTopic } from '@/lib/domain/content-topics'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: '商业洞察与宏观思考 — JESS.PU',
  description: '用结构化的视角审视世界。独立、深度的宏观趋势与公司研究分析。',
}

export const dynamic = 'force-dynamic'

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const contents = await getContentsByCategory('business-analysis')
  const requestedTopic = params.topic || '全部'
  const activeTopic = ANALYSIS_TOPICS.includes(requestedTopic as (typeof ANALYSIS_TOPICS)[number])
    ? requestedTopic
    : '全部'
  const filtered = contents.filter((item) => matchTopic(item, activeTopic))

  return (
    <>
      <FigmaTopNav active="analysis" badge="ANALYSIS" />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <h1>
              商业洞察 &
              <span>宏观思考</span>
            </h1>
            <p>用结构化的视角审视世界。过滤杂音，从宏观趋势、公司研究到财报拆解，提供独立、深度的见解。</p>
          </div>
        </section>

        <section className={`page-shell ${styles.main}`}>
          <aside className={styles.sidebar}>
            <p className={styles.sideTitle}>索引</p>
            <ul>
              {ANALYSIS_TOPICS.map((topic) => (
                <li key={topic}>
                  <Link href={makeTopicHref('/analysis', topic)} className={topic === activeTopic ? styles.active : styles.topicLink}>
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
            <div className={styles.subscribeBox}>
              <p>不错过任何重要分析。</p>
              <a href="/subscribe">订阅</a>
            </div>
          </aside>

          <div className={styles.content}>
            <div className={styles.sectionTitle}>{activeTopic === '全部' ? '最新财报' : `${activeTopic} · 最新内容`}</div>
            {filtered.map((item, index) => (
              <article key={item.id || index} className={styles.card}>
                <div className={styles.cardMeta}>
                  <p className={styles.meta}>{(item.publishedAt || '').slice(0, 10)} · 深度分析</p>
                  <span className={styles.ticker}>$TICK</span>
                </div>
                <h3>
                  <Link href={`/post/${item.slug}`}>{item.title}</Link>
                </h3>
                <div className={styles.summary}>
                  <p>核心要点：{item.keyArgument || '利润率改善，海外扩张能力仍在释放。'}</p>
                  <p>分析框架：{item.analysisFramework || '单位经济性 + 增长引擎 + 估值修复'}</p>
                </div>
                <div className={styles.cardBottom}>
                  <Link href={`/post/${item.slug}`} className={styles.action}>
                    阅读全文 →
                  </Link>
                  <Link href="/subscribe" className={styles.tipAction}>
                    打赏支持
                  </Link>
                </div>
              </article>
            ))}
            {filtered.length === 0 ? (
              <article className={styles.emptyState}>
                <h3>该专题暂时还没有内容</h3>
                <p>先查看全部专题，或去公开实验室提交你关心的问题。</p>
                <div className={styles.emptyActions}>
                  <Link href="/analysis">查看全部</Link>
                  <Link href="/lab">提交选题 →</Link>
                </div>
              </article>
            ) : null}
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  )
}

