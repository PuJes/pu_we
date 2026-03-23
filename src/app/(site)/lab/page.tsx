import type { Metadata } from 'next'
import Link from 'next/link'

import { IdeaSubmitForm } from '@/components/forms/IdeaSubmitForm'
import { VoteButton } from '@/components/forms/VoteButton'
import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getIdeas } from '@/lib/data/queries'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: '公开实验室 — JESS.PU',
  description: '提出你的产品创意，为你的痛点投票，一切公开构建。',
}

export const dynamic = 'force-dynamic'

function buildLabPath({
  sort,
  status,
}: {
  sort?: 'hot' | 'latest'
  status?: string
}) {
  const search = new URLSearchParams()

  if (sort && sort !== 'hot') {
    search.set('sort', sort)
  }

  if (status) {
    search.set('status', status)
  }

  const query = search.toString()
  return query ? `/lab?${query}` : '/lab'
}

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const sort = params.sort === 'latest' ? 'latest' : 'hot'
  const ideas = await getIdeas({ sort, status: params.status })
  const submitCtaLabel = '提交你的创意'

  return (
    <>
      <FigmaTopNav active="lab" badge="OPEN LAB" />
      <main className={`page-shell ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>产品公开实验室</h1>
          <p>
            这里是关于 AI、工作流、产品的实验室。每一个划时代的产品都始于一个粗糙的想法。提出你的想法，为你的痛点点赞，我负责帮你实现。
          </p>
        </header>

        <section className={styles.pathCards}>
          <article>
            <h3>路径 A：参与已有创意</h3>
            <p>先浏览高票 Idea，点赞表达共识，再进入详情补充讨论场景。</p>
          </article>
          <article>
            <h3>路径 B：提交新创意</h3>
            <p>没有匹配项时直接提创意，系统会在必要时自动唤起 OTP 验证并续提。</p>
          </article>
        </section>

        <section className={styles.toolsRow}>
          <div className={styles.metrics}>
            <div>
              <strong>{ideas.length}</strong>
              <span>创意库</span>
            </div>
            <div>
              <strong>{ideas.filter((item) => item.status === 'in-progress').length}</strong>
              <span>活跃项目</span>
            </div>
            <div>
              <strong>{ideas.filter((item) => item.status === 'launched').length}</strong>
              <span>已发布</span>
            </div>
          </div>

          <div className={styles.sortLinks}>
            <Link
              href={buildLabPath({ sort: 'hot', status: params.status })}
              className={sort === 'hot' ? styles.activeSort : ''}
            >
              高票优先
            </Link>
            <Link
              href={buildLabPath({ sort: 'latest', status: params.status })}
              className={sort === 'latest' ? styles.activeSort : ''}
            >
              最新发布
            </Link>
            <Link
              href={buildLabPath({
                sort,
                status: params.status === 'in-progress' ? undefined : 'in-progress',
              })}
              className={params.status === 'in-progress' ? styles.activeSort : ''}
            >
              开发中
            </Link>
          </div>
        </section>

        {(() => {
          const activeStatuses = ['approved', 'in-progress', 'launched', 'reviewed']
          const activeIdeas = ideas.filter((item) => activeStatuses.includes(item.status))
          const poolIdeas = ideas.filter((item) => !activeStatuses.includes(item.status))

          const statusLabel = (s: string) => {
            const map: Record<string, string> = {
              pending: '💡 等待共鸣',
              discussing: '💬 讨论中',
              approved: '✅ 已立项',
              'in-progress': '🚧 研发中',
              launched: '🚀 已交付',
              reviewed: '📝 已复盘',
            }
            return map[s] || s
          }
          const poolNote = (s: string) => {
            if (s === 'discussing') {
              return '已进入评估阶段，欢迎继续补充具体场景。'
            }

            return '票数达到阈值会自动进入评估。'
          }

          return (
            <>
              {activeIdeas.length > 0 && (
                <section className={styles.sectionBlock}>
                  <h2 className={styles.sectionTitle}>⚙️ 实验行进区</h2>
                  <p className={styles.sectionDesc}>已立项、研发中或已交付的项目，Builder 正在推进中。</p>
                  <div className={styles.grid}>
                    {activeIdeas.map((idea) => (
                      <article key={idea.id} className={styles.card}>
                        <div className={styles.cardHead}>
                          <span className={styles.status}>{statusLabel(idea.status)}</span>
                          <span>{idea.priorityScore} priority</span>
                        </div>
                        <h3>
                          <Link href={`/lab/idea/${idea.slug}`} className={styles.ideaLink}>
                            {idea.title}
                          </Link>
                        </h3>
                        <p>{idea.description}</p>
                        {idea.targetVersion ? (
                          <div className={styles.builderNote}>预计上线版本：{idea.targetVersion}</div>
                        ) : null}
                        <div className={styles.cardFooter}>
                          <div className={styles.avatars}>
                            <span /><span /><span />
                            <em>+{idea.voteCount}</em>
                          </div>
                          <VoteButton ideaId={idea.id} initialCount={idea.voteCount} />
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className={styles.sectionBlock}>
                <h2 className={styles.sectionTitle}>💡 待定灵感池</h2>
                <p className={styles.sectionDesc}>等待共鸣和讨论的创意，你的投票将决定它们的命运。</p>
                <div className={styles.grid}>
                  {poolIdeas.map((idea) => (
                    <article key={idea.id} className={styles.card}>
                      <div className={styles.cardHead}>
                        <span className={styles.status}>{statusLabel(idea.status)}</span>
                        <span>{idea.priorityScore} priority</span>
                      </div>
                      <h3>
                        <Link href={`/lab/idea/${idea.slug}`} className={styles.ideaLink}>
                          {idea.title}
                        </Link>
                      </h3>
                      <p>{idea.description}</p>
                      <div className={styles.builderNote}>{poolNote(idea.status)}</div>
                      <div className={styles.cardFooter}>
                        <div className={styles.avatars}>
                          <span /><span /><span />
                          <em>+{idea.voteCount}</em>
                        </div>
                        <VoteButton ideaId={idea.id} initialCount={idea.voteCount} />
                      </div>
                    </article>
                  ))}
                  {poolIdeas.length === 0 && (
                    <p className={styles.emptyHint}>灵感池暂时空了，快来提交你的第一个创意！</p>
                  )}
                </div>
              </section>
            </>
          )
        })()}

        <section id="submit" className={styles.submitSection}>
          <div className={styles.submitHero}>
            <span className={styles.submitEyebrow}>OPEN CALL FOR IDEAS</span>
            <h2 className={styles.submitTitle}>把那个你反复抱怨的问题，直接丢进公开实验室。</h2>
            <p className={styles.submitDesc}>
              不需要商业计划书，也不需要把它包装得很完美。只要告诉我它卡住了谁、在哪个场景最痛、为什么你希望它被做出来。
            </p>
            <div className={styles.submitSignals}>
              <span>适合真实痛点</span>
              <span>适合半成型灵感</span>
              <span>适合你一直想要却没人认真做的工具</span>
            </div>
          </div>
          <div className={styles.submitCanvas}>
            <IdeaSubmitForm submitLabel={submitCtaLabel} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
