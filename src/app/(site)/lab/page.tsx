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
  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: '等待共鸣',
      discussing: '讨论中',
      approved: '准备启动',
      'in-progress': '研发中',
      launched: '已交付',
      reviewed: '已复盘',
    }
    return map[s] || s
  }
  const statusHint = (s: string) => {
    if (s === 'pending') return '等待更多人投票确认这是个值得启动的问题。'
    if (s === 'discussing') return '已经进入评估阶段，欢迎继续补充具体使用场景。'
    if (s === 'approved') return '方向已经确认，正在安排实现节奏与版本范围。'
    if (s === 'in-progress') return '已经进入构建流程，后续会持续公开进展。'
    if (s === 'launched') return '已经发布，可以进入详情查看成果和后续迭代。'
    if (s === 'reviewed') return '已经完成复盘，适合回看经验、结果与后续动作。'
    return '公开实验进行中。'
  }
  const roadmapColumns = [
    {
      key: 'pending',
      title: '等待共鸣',
      description: '刚被提出，等待更多人投票。',
      ideas: ideas.filter((item) => item.status === 'pending'),
    },
    {
      key: 'discussing',
      title: '讨论中',
      description: '已经进入评估，正在收集更多上下文。',
      ideas: ideas.filter((item) => item.status === 'discussing'),
    },
    {
      key: 'building',
      title: '研发中',
      description: '已立项并在推进，包含准备启动与正在开发。',
      ideas: ideas.filter((item) => ['approved', 'in-progress'].includes(item.status)),
    },
    {
      key: 'shipped',
      title: '已交付',
      description: '已经上线或完成复盘，可查看结果。',
      ideas: ideas.filter((item) => ['launched', 'reviewed'].includes(item.status)),
    },
  ]

  return (
    <>
      <FigmaTopNav active="lab" badge="OPEN LAB" />
      <main className={`page-shell ${styles.page}`}>
        <header className={styles.header}>
          <span className={styles.liveBadge}>System Active | 接收创意中</span>
          <h1 className={styles.title}>公开实验室</h1>
          <p>
            把真实问题丢进来。社区先投票确认共识，我再把值得做的部分公开推进、上线和复盘。
          </p>
        </header>

        <section className={styles.overviewPanel}>
          <div className={styles.overviewCopy}>
            <span className={styles.overviewEyebrow}>参与方式</span>
            <h2>先投票表达共识；没有合适的，就直接提交新的问题。</h2>
            <p>所有创意都会进入同一个公开看板，被讨论、被排优先级、被推进到上线与复盘。</p>
          </div>
          <div className={styles.overviewControls}>
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
          </div>
        </section>

        <section className={styles.sectionBlock}>
          <div className={styles.roadmapShell}>
            <div className={styles.roadmapIntro}>
              <span className={styles.roadmapBadge}>公开看板</span>
              <div>
                <h2 className={styles.sectionTitle}>公开 Roadmap</h2>
                <p className={styles.sectionDesc}>所有创意都会在这里按状态公开排队。先看有没有人已经提过，再决定是投票、补充细节，还是提交一个新问题。</p>
              </div>
              <div className={styles.roadmapSignals}>
                <span>状态公开</span>
                <span>优先级可见</span>
                <span>支持继续补充</span>
              </div>
            </div>
            <div className={styles.roadmapBoard}>
              {roadmapColumns.map((column) => (
                <section key={column.key} className={styles.roadmapColumn} data-column={column.key}>
                  <header className={styles.columnHead}>
                    <div>
                      <h3>{column.title}</h3>
                      <p>{column.description}</p>
                    </div>
                    <span className={styles.columnCount}>{column.ideas.length}</span>
                  </header>
                  <div className={styles.columnCards}>
                    {column.ideas.length > 0 ? (
                      column.ideas.map((idea) => (
                        <article key={idea.id} className={styles.card}>
                          <div className={styles.cardHead}>
                            <span className={styles.status} data-status={idea.status}>
                              {statusLabel(idea.status)}
                            </span>
                            <span>优先级 {idea.priorityScore}</span>
                          </div>
                          <h3>
                            <Link href={`/lab/idea/${idea.slug}`} className={styles.ideaLink}>
                              {idea.title}
                            </Link>
                          </h3>
                          <p>{idea.description}</p>
                          <div className={styles.builderNote}>
                            {idea.targetVersion ? `目标版本：${idea.targetVersion}` : statusHint(idea.status)}
                          </div>
                          <div className={styles.cardFooter}>
                            <div className={styles.avatars}>
                              <span /><span /><span />
                              <em>+{idea.voteCount}</em>
                            </div>
                            <VoteButton ideaId={idea.id} initialCount={idea.voteCount} />
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className={styles.emptyColumn}>
                        <p>这一列暂时还没有项目。</p>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <section id="submit" className={styles.submitSection}>
          <div className={styles.submitHero}>
            <span className={styles.submitEyebrow}>NEW SUBMISSION</span>
            <h2 className={styles.submitTitle}>写得越具体，最后做出来的结果越接近你的预期。</h2>
            <p className={styles.submitDesc}>一句话标题加一个真实场景就够开始。先把问题说清楚，再让看板替你把它推进下去。</p>
            <div className={styles.submitSignals}>
              <span>谁在卡住</span>
              <span>卡在哪个场景</span>
              <span>你希望得到什么结果</span>
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
