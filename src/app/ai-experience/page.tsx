import Link from 'next/link'

import { getContentsByCategory } from '@/lib/data/queries'
import { AI_TOPICS, makeTopicHref, matchTopic } from '@/lib/domain/content-topics'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function AIExperiencePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const contents = await getContentsByCategory('ai-experiments')
  const requestedTopic = params.topic || '全部'
  const activeTopic = AI_TOPICS.includes(requestedTopic as (typeof AI_TOPICS)[number]) ? requestedTopic : '全部'
  const filtered = contents.filter((item) => matchTopic(item, activeTopic))
  const hero = filtered[0] || contents[0]
  const listItems = filtered.slice(1)
  const heroTakeaways = hero?.takeaways?.map((item) => item.item).filter(Boolean).slice(0, 3) || []

  return (
    <main className="page-shell">
      <header className={styles.header}>
        <p className="page-caption">Knowledge Stream</p>
        <h1 className="page-title">AI 经验分享</h1>
        <p className="page-subtitle">记录创造过程中的那些混乱与惊喜。从 vibe coding 实验经验到日常 AI 工作流。</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div>
            <p className={styles.sideTitle}>Collections</p>
            <ul>
              {AI_TOPICS.map((topic) => (
                <li key={topic}>
                  <Link
                    href={makeTopicHref('/ai-experience', topic)}
                    className={topic === activeTopic ? styles.activeTopic : styles.topicLink}
                  >
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className={styles.sideTitle}>Archive</p>
            <ul>
              <li>2026</li>
              <li>2025</li>
            </ul>
          </div>
          <div className={styles.helpCard}>
            <strong>Need something else?</strong>
            <p>Request it in the Lab.</p>
            <a href="/lab">Go to Open Lab →</a>
          </div>
        </aside>

        <section className={styles.feed}>
          <div className={styles.feedHead}>
            <h2>Latest Experiences</h2>
            <span>SORT: NEWEST</span>
          </div>

          <article className={styles.heroCard}>
            <div className={styles.heroMain}>
              <p className={styles.meta}>{hero?.type.toUpperCase()} · {(hero?.publishedAt || '').slice(0, 10)}</p>
              <h3>{hero?.title || '氛围编程 (Vibe Coding): 如何写出让 AI 真正理解意图的提示词'}</h3>
              <p>{hero?.snippet || '别再试毒气式 LLM 写代码了，从描述系统架构开始。'}</p>
              <div className={styles.noteBox}>
                {(heroTakeaways.length > 0
                  ? heroTakeaways
                  : ['描述架构而非语法', '提供反例比正例更关键', '明确边界与失败回滚策略']
                ).map((item, index) => (
                  <p key={`${hero?.slug || 'hero'}-takeaway-${index}`}>
                    {String(index + 1).padStart(2, '0')}. {item}
                  </p>
                ))}
              </div>
              {hero ? (
                <Link href={`/post/${hero.slug}`} className={styles.readMore}>
                  阅读全文 →
                </Link>
              ) : null}
            </div>
            <div className={styles.codeMock}>
              <span />
              <pre>{`if Good Prompt Structure:
  role: "senior architect"
  task: "define schema"
else:
  "no vibe"`}</pre>
            </div>
          </article>

          {listItems.map((item, index) => (
            <article key={item.id || index} className={styles.listCard}>
              <p className={styles.meta}>{item.type.toUpperCase()} · {(item.publishedAt || '').slice(0, 10)}</p>
              <h3>{item.title}</h3>
              <p>{item.snippet || '一份用于公开构建的生产级模板。'}</p>
              <Link href={`/post/${item.slug}`} className={styles.readMore}>
                阅读全文 →
              </Link>
            </article>
          ))}
          {filtered.length === 0 ? (
            <article className={styles.emptyState}>
              <h3>该分类暂时还没有内容</h3>
              <p>可以先查看全部文章，或去公开实验室提交你想看的主题。</p>
              <div className={styles.emptyActions}>
                <Link href="/ai-experience">查看全部</Link>
                <Link href="/lab">去 Open Lab →</Link>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  )
}
