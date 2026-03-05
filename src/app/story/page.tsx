import Image from 'next/image'
import Link from 'next/link'

import { getContentsByCategory } from '@/lib/data/queries'
import { STORY_TOPICS, makeTopicHref, matchTopic } from '@/lib/domain/content-topics'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

const coverA = 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1000&q=80'
const coverB = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80'
const coverC = 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80'
const coverPool = [coverA, coverB, coverC]

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
  const notes = filtered.slice(2)

  return (
    <main className="page-shell">
      <header className={styles.header}>
        <h1 className="page-title">我的故事</h1>
        <p className="page-subtitle">在 AI 和代码之外，这里有一个关于我个人成长、生活故事的一切。</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.sideTitle}>重心分类</p>
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
                    <Image src={coverPool[index % coverPool.length]} alt="cover" fill sizes="(max-width: 900px) 100vw, 460px" />
                  </div>
                  <div>
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
                  <div>
                    <p className={styles.meta}>
                      {(item.publishedAt || '').slice(0, 10)} · {item.type}
                    </p>
                    <h3>{item.title}</h3>
                    <p>{item.snippet || '从生活片段里记录长期主义。'}</p>
                    <Link href={`/post/${item.slug}`}>阅读全文 →</Link>
                  </div>
                  <div className={styles.imageWrap}>
                    <Image src={coverPool[index % coverPool.length]} alt="cover" fill sizes="(max-width: 900px) 100vw, 460px" />
                  </div>
                </>
              )}
            </article>
          ))}

          {notes.map((item, index) => (
            <article key={`${item.id || index}-note`} className={styles.noteCard}>
              <p className={styles.meta}>
                {(item.publishedAt || '').slice(0, 10)} · {item.type}
              </p>
              <h3>{item.title}</h3>
              <p>{item.snippet || '持续记录，帮助我回到真实的生活节奏。'}</p>
              <Link href={`/post/${item.slug}`} className={styles.noteLink}>
                阅读全文 →
              </Link>
            </article>
          ))}

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
        </section>
      </div>
    </main>
  )
}
