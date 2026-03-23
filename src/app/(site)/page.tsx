import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { SubscribeForm } from '@/components/forms/SubscribeForm'
import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getHomeSnapshot } from '@/lib/data/queries'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'JESS.PU — 通过创造实现自由，通过分享放大价值',
  description:
    '一个公开构建的个人独立站。包含公开实验室、AI 经验分享、商业分析洞察和个人故事。',
  openGraph: {
    title: 'JESS.PU — 通过创造实现自由，通过分享放大价值',
    description:
      '一个公开构建的个人独立站。包含公开实验室、AI 经验分享、商业分析洞察和个人故事。',
    siteName: 'JESS.PU',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'

const storyImage = 'https://www.figma.com/api/mcp/asset/8d51a6a4-12a3-4fd7-9c52-8f6a26372b01'

export default async function HomePage() {
  const { counters, ideas, recentContents } = await getHomeSnapshot()
  const labIdeas = ideas.slice(0, 4)
  const report = recentContents.find((item) => item.category === 'business-analysis') || recentContents[0]
  const ai = recentContents.find((item) => item.category === 'ai-experiments') || recentContents[1]

  return (
    <>
      <FigmaTopNav active="home" compact={false} subscribePill={false} />
      <main className="page-shell">
        <section className={styles.brand}>JESS.PU</section>

        <section className={styles.valueRow}>
          <h1 className={styles.slogan}>通过创造实现自由， 通过分享放大价值</h1>
          <div className={styles.valueCols}>
            <div className={styles.valueCol}>
              <p className={styles.label}>🎯 追求</p>
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
              <p className={styles.label}>⚙️ 方法论</p>
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
          <Link href="/lab" className={`${styles.card} ${styles.labCard}`}>
            <div className={styles.cardHead}>
              <span className={styles.labelBlue}>公开实验室</span>
              <span className={styles.live}>LIVE DATA</span>
            </div>
            <h3>想法孵化+产品讨论+实现！</h3>
            <div className={styles.progressList}>
              {labIdeas.map((idea) => (
                <div key={idea.id} className={styles.progressItem}>
                  <div>
                    <p>
                      {idea.status === 'in-progress'
                        ? '🚧 研发中'
                        : idea.status === 'launched'
                          ? '🚀 已交付'
                          : '💡 等待共鸣'}
                    </p>
                    <span>{idea.title}</span>
                  </div>
                  <strong>{idea.voteCount} ↗</strong>
                </div>
              ))}
            </div>
            <span className={styles.moreLink}>
              参与共创 →
            </span>
          </Link>

          <Link href={report ? `/post/${report.slug}` : '/analysis'} className={`${styles.card} ${styles.reportCard}`}>
            <p className={styles.meta}>商业分析 · {(report?.publishedAt || '').slice(0, 7).replace('-', ' Q')}</p>
            <h3>{report?.title || '暂无最新商业分析'}</h3>
            <p className={styles.desc}>{report?.keyArgument || '用结构化框架看世界，沉淀商业基本面理解。'}</p>
            <div className={styles.tags}>
              {(report?.tags || []).slice(0, 2).map((t, i) => (
                <span key={`report-tag-${i}`} className="soft-tag">{t.tag}</span>
              ))}
              {(!report?.tags || report.tags.length === 0) && (
                <>
                  <span className="soft-tag">STRATEGY</span>
                  <span className="soft-tag" style={{ background: '#ecfdf5', color: '#0f8b62' }}>Long Position</span>
                </>
              )}
            </div>
          </Link>

          <Link href={ai ? `/post/${ai.slug}` : '/ai-experience'} className={`${styles.card} ${styles.aiCard}`}>
            <p className={styles.meta}>AI 经验 · {(ai?.publishedAt || '').slice(0, 7).replace('-', ' Q')}</p>
            <h3>{ai?.title || '暂无最新 AI 经验'}</h3>
            {ai?.takeaways && ai.takeaways.length > 0 ? (
              <p className={styles.desc}>{ai.takeaways[0].item}</p>
            ) : null}
            <div className={styles.tags}>
              {(ai?.tags || []).slice(0, 2).map((t, i) => (
                <span key={`ai-tag-${i}`} className="soft-tag">{t.tag}</span>
              ))}
              {(!ai?.tags || ai.tags.length === 0) && (
                <>
                  <span className="soft-tag">vibecoding</span>
                  <span className="soft-tag" style={{ background: '#ecfdf5', color: '#0f8b62' }}>cursor</span>
                </>
              )}
            </div>
          </Link>

          <Link href="/story" className={`${styles.card} ${styles.storyCard}`}>
            <Image src={storyImage} alt="story" fill sizes="(max-width:900px) 100vw, 340px" />
            <div className={styles.overlay}>
              <p>&ldquo;周末去山里放空，断网的两天找回了平静...&rdquo;</p>
              <span>翻阅数字花园 →</span>
            </div>
          </Link>
        </section>

        <section className={styles.recentSection}>
          <div className={styles.sectionHead}>
            <span>近期发布</span>
            <Link href="/story">查看归档</Link>
          </div>
          <div className={styles.timeline}>
            {recentContents.slice(0, 6).map((item, index) => (
              <Link key={item.id || index} href={`/post/${item.slug}`} className={styles.row}>
                <span>{(item.publishedAt || '').slice(0, 10) || '2026-02-28'}</span>
                <span>{item.title}</span>
                <em>
                  {item.category === 'ai-experiments'
                    ? 'AI 经验'
                    : item.category === 'business-analysis'
                      ? '商业洞察'
                      : '我的故事'}
                </em>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <h2>共同见证，一起同行</h2>
            <p>我们想在每一个里程碑时刻，即刻与你分享喜悦。欢迎聊聊想法，也欢迎诚意合作。</p>
          </div>
          <SubscribeForm
            className={styles.subscribeForm}
            inputClassName={styles.subscribeInput}
            buttonClassName={styles.subscribeButton}
            feedbackClassName={styles.subscribeFeedback}
          />
        </div>
      </footer>

      <SiteFooter />
    </>
  )
}
