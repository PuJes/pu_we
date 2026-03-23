import type { Metadata } from 'next'
import Link from 'next/link'

import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getContentsByCategory } from '@/lib/data/queries'
import { AI_TOPICS, makeTopicHref, matchTopic } from '@/lib/domain/content-topics'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'AI 经验分享 — JESS.PU',
  description: '记录创造过程中的 AI 实践经验。从 vibe coding 到日常 AI 工作流。',
}

export const dynamic = 'force-dynamic'

const topicLabelMap: Record<string, string> = {
  全部: '🛠️ 公开构建项目',
  公开构建洞察: '🛠️ 公开构建项目',
  自动化工作流: '⚡ 自动化工作流',
  提示词实证: '🧠 模型深度评测',
  'Agent 智能体探索': '🤖 Agent 智能体探索',
}

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
    <>
      <FigmaTopNav active="ai" badge="EXPERIENCE" />
      <main className={`page-shell ${styles.page}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>Knowledge Stream</p>
          <h1 className={styles.title}>
            AI <span>经验分享</span>
          </h1>
          <p className={styles.subtitle}>记录创造过程中的那些混乱与惊喜。从 vibe coding 实践经验到日常 AI 工作流。</p>
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
                      {topicLabelMap[topic] || topic}
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
              <a href="/subscribe" className={styles.tipLink}>☕ 请我喝杯咖啡</a>
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
                <h3>{hero?.title || '氛围编程 (Vibe Coding)：如何写出让 AI 真正理解意图的提示词'}</h3>
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
                  <div className={styles.heroActions}>
                    <Link href={`/post/${hero.slug}`} className={styles.primaryAction}>
                      阅读全文
                    </Link>
                    <Link href="/subscribe" className={styles.secondaryAction}>
                      请我喝杯咖啡
                    </Link>
                  </div>
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

            <section className={styles.toolsSection}>
              <div className={styles.toolsHead}>
                <h3>工作流与工具</h3>
                <span>2 ITEMS</span>
              </div>
              <div className={styles.toolsGrid}>
                <article>
                  <h4>RSS 转 Newsletter 助手</h4>
                  <p>使用 n8n 与 OpenAI API 自动化内容策展。</p>
                  <a href="#">View Workflow</a>
                </article>
                <article>
                  <h4>合成数据生成器</h4>
                  <p>用于生成演示环境真实用户数据的 Python 脚本。</p>
                  <a href="#">View Scripts</a>
                </article>
              </div>
            </section>

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
      <SiteFooter />
    </>
  )
}
