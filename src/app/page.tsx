import Image from 'next/image'
import Link from 'next/link'

import { getHomeSnapshot } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

const storyImage = 'https://www.figma.com/api/mcp/asset/8d51a6a4-12a3-4fd7-9c52-8f6a26372b01'

export default async function HomePage() {
  const { counters, ideas, recentContents } = await getHomeSnapshot()
  const labIdeas = ideas.slice(0, 4)
  const report = recentContents.find((item) => item.category === 'business-analysis') || recentContents[0]
  const ai = recentContents.find((item) => item.category === 'ai-experiments') || recentContents[1]

  return (
    <main className="page-shell">
      <section className={styles.brand}>JESS.PU</section>

      <section className={styles.valueRow}>
        <h1 className={styles.slogan}>通过创造实现自由， 通过分享放大价值</h1>
        <div className={styles.valueCols}>
          <div className={styles.valueCol}>
            <p className="page-caption">追求</p>
            <p>
              <span>创造：</span>做喜欢的事情
            </p>
            <p>
              <span>自由：</span>追求财富自由与精神自由
            </p>
            <p>
              <span>分享：</span>秉承公开与互助原则
            </p>
          </div>
          <div className={styles.valueCol}>
            <p className="page-caption">方法论</p>
            <p>
              <span>行动至上：</span>Action speaks louder.
            </p>
            <p>
              <span>尝试10次法：</span>不要被一次失败吓退
            </p>
            <p>
              <span>长期主义：</span>做时间的朋友
            </p>
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className={styles.stat}>
          <i className="dot" style={{ background: 'var(--orange)' }} />
          {counters.ideas} 个公开实验
        </div>
        <div className={styles.stat}>
          <i className="dot" style={{ background: 'var(--blue)' }} />
          {counters.ai} 篇 AI 经验
        </div>
        <div className={styles.stat}>
          <i className="dot" style={{ background: 'var(--green)' }} />
          {counters.analysis} 篇商业洞察
        </div>
      </section>

      <section className={styles.engineGrid}>
        <article className={`${styles.card} ${styles.labCard}`}>
          <div className={styles.cardHead}>
            <span className={styles.labelBlue}>公开实验室</span>
            <span className={styles.live}>LIVE DATA</span>
          </div>
          <h3>想法孵化+产品讨论+实现!</h3>
          <div className={styles.progressList}>
            {labIdeas.map((idea) => (
              <div key={idea.id} className={styles.progressItem}>
                <div>
                  <p>{idea.title}</p>
                  <span>持续迭代中 (v0.8)</span>
                </div>
                <strong>{idea.voteCount}</strong>
              </div>
            ))}
          </div>
          <Link href="/lab" className={styles.moreLink}>
            参与共创
          </Link>
        </article>

        <article className={`${styles.card} ${styles.reportCard}`}>
          <p className={styles.meta}>商业分析 · 2026 Q4</p>
          <h3>{report?.title || '2025Q4 腾讯财报观察：游戏饱和后，新增长引擎在哪里?'}</h3>
          <p className={styles.desc}>
            {report?.keyArgument || '游戏老树新枝，海外与广告仍有结构性机会。'}
          </p>
          <div className={styles.tags}>
            <span className="soft-tag">STRATEGY</span>
            <span className="soft-tag" style={{ background: '#ecfdf5', color: '#0f8b62' }}>
              Long Position
            </span>
          </div>
        </article>

        <article className={`${styles.card} ${styles.aiCard}`}>
          <p className={styles.meta}>AI 经验 · 2026 Q4</p>
          <h3>{ai?.title || '如何在3天内构建 MVP'}</h3>
          <div className={styles.tags}>
            <span className="soft-tag">vibecoding</span>
            <span className="soft-tag" style={{ background: '#ecfdf5', color: '#0f8b62' }}>
              cursor
            </span>
          </div>
        </article>

        <article className={`${styles.card} ${styles.storyCard}`}>
          <Image src={storyImage} alt="story" fill sizes="(max-width:900px) 100vw, 340px" />
          <div className={styles.overlay}>
            <p>“周末去山里放空，断网的两天找回了平静...”</p>
            <Link href="/story">查看归档 →</Link>
          </div>
        </article>
      </section>

      <section className={styles.recentSection}>
        <div className={styles.sectionHead}>
          <span>近期发布</span>
          <Link href="/story">查看归档</Link>
        </div>
        <div className={styles.timeline}>
          {recentContents.slice(0, 4).map((item, index) => (
            <div key={item.id || index} className={styles.row}>
              <span>{(item.publishedAt || '').slice(0, 10) || '2026-02-28'}</span>
              <span>{item.title}</span>
              <em>
                {item.category === 'ai-experiments'
                  ? 'AI 经验'
                  : item.category === 'business-analysis'
                    ? '商业洞察'
                    : '我的故事'}
              </em>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div>
          <h2>共同见证，一起同行</h2>
          <p>我们想在每一个里程碑时刻，即刻与你分享喜悦。欢迎聊聊想法，也欢迎诚意合作。</p>
        </div>
        <form action="/api/subscribe" method="post" className={styles.subscribeForm}>
          <input name="email" type="email" placeholder="your@email.com" />
          <button type="submit">立即订阅</button>
        </form>
      </section>
    </main>
  )
}
