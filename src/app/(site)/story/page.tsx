/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next'
import Link from 'next/link'

import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getContentsByCategory } from '@/lib/data/queries'
import { STORY_TOPICS, makeTopicHref, matchTopic } from '@/lib/domain/content-topics'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: '我的故事 — JESS.PU',
  description: '在 AI 和代码之外，关于个人成长、生活故事的一切。',
}

export const dynamic = 'force-dynamic'

const coverA = '/art/story-cover-a.svg'
const coverB = '/art/story-cover-b.svg'
const coverPool = [coverA, coverB]

export default async function StoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const contents = await getContentsByCategory('my-story')
  const requestedTopic = params.topic || '全部'
  const activeTopic = STORY_TOPICS.includes(requestedTopic as (typeof STORY_TOPICS)[number]) ? requestedTopic : '全部'
  const filtered = contents.filter((item) => matchTopic(item, activeTopic))
  const featured = filtered.slice(0, 2)
  const note = filtered[2]

  return (
    <>
      <FigmaTopNav active="story" badge="STORY" />
      <main className={`page-shell ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>我的故事</h1>
          <p>在 AI 和代码之外，这里有一个关于我个人成长、生活故事的一切。</p>
        </header>

        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <p className={styles.sideTitle}>集合分类</p>
            <ul>
              {STORY_TOPICS.map((topic) => (
                <li key={topic}>
                  <Link href={makeTopicHref('/story', topic)} className={topic === activeTopic ? styles.active : styles.topicLink}>
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section className={styles.feed}>
            {featured.map((item, index) => (
              <article key={item.id || index} className={styles.row}>
                {index % 2 === 0 ? (
                  <>
                    <div className={styles.imageWrap}>
                      <img src={coverPool[index % coverPool.length]} alt="cover" className={styles.coverImage} />
                    </div>
                    <div className={styles.copy}>
                      <p className={styles.meta}>
                        {(item.publishedAt || '').slice(0, 10)} · {item.type}
                      </p>
                      <h3>{item.title}</h3>
                      <p>{item.snippet || '从生活片段里记录长期主义。'}</p>
                      <Link href={`/post/${item.slug}`}>阅读全文 →</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={styles.copy}>
                      <p className={styles.meta}>
                        {(item.publishedAt || '').slice(0, 10)} · {item.type}
                      </p>
                      <h3>{item.title}</h3>
                      <p>{item.snippet || '从生活片段里记录长期主义。'}</p>
                      <Link href={`/post/${item.slug}`}>阅读全文 →</Link>
                    </div>
                    <div className={styles.imageWrap}>
                      <img src={coverPool[index % coverPool.length]} alt="cover" className={styles.coverImage} />
                    </div>
                  </>
                )}
              </article>
            ))}

            {note ? (
              <article className={styles.noteCard}>
                <p className={styles.meta}>
                  {(note.publishedAt || '').slice(0, 10)} · {note.type}
                </p>
                <h3>{note.title}</h3>
                <p>{note.snippet || '持续记录，帮助我回到真实的生活节奏。'}</p>
                <div className={styles.noteActions}>
                  <span>♡ 124</span>
                  <Link href="/subscribe">赞赏</Link>
                </div>
              </article>
            ) : null}

            {filtered.length === 0 ? (
              <article className={styles.noteCard}>
                <h3>这个分类还没有文章</h3>
                <p>你可以先看全部内容，或者去公开实验室提一个你想看的主题。</p>
                <div className={styles.emptyActions}>
                  <Link href="/story">查看全部</Link>
                  <Link href="/lab">去 Open Lab →</Link>
                </div>
              </article>
            ) : null}

            <div className={styles.loadMore}>加载更多旧动态</div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
