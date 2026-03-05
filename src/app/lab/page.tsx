import Link from 'next/link'

import { IdeaSubmitForm } from '@/components/forms/IdeaSubmitForm'
import { VoteButton } from '@/components/forms/VoteButton'
import { getIdeas } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function LabPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const sort = params.sort === 'latest' ? 'latest' : 'hot'
  const ideas = await getIdeas({ sort, status: params.status })

  return (
    <main className="page-shell">
      <header className={styles.header}>
        <h1 className="page-title">产品公开实验室</h1>
        <p className="page-subtitle">
          这里是关于 AI、工作流、产品的实验室。提出你的想法，为你的痛点点赞，我负责帮你实现。
        </p>
      </header>

      <section className={styles.metrics}>
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
      </section>

      <section className={styles.sortRow}>
        <div />
        <div className={styles.sortLinks}>
          <Link href="/lab?sort=hot" className={sort === 'hot' ? styles.activeSort : ''}>
            高优先
          </Link>
          <Link href="/lab?sort=latest" className={sort === 'latest' ? styles.activeSort : ''}>
            最新发布
          </Link>
          <Link href="/lab?status=in-progress">开发中</Link>
        </div>
      </section>

      <section className={styles.grid}>
        {ideas.slice(0, 6).map((idea) => (
          <article key={idea.id} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.status}>{idea.status}</span>
              <span>{idea.priorityScore} priority</span>
            </div>
            <h3>
              <Link href={`/lab/idea/${idea.slug}`} className={styles.ideaLink}>
                {idea.title}
              </Link>
            </h3>
            <p>{idea.description}</p>
            <div className={styles.builderNote}>Builder&apos;s Note: 根据热度和价值排序，票数达到阈值进入评估。</div>
            <Link href={`/lab/idea/${idea.slug}`} className={styles.detailLink}>
              进入详情页 →
            </Link>
            <div className={styles.cardFooter}>
              <div className={styles.avatars}>
                <span />
                <span />
                <span />
                <em>+{idea.voteCount}</em>
              </div>
              <VoteButton ideaId={idea.id} initialCount={idea.voteCount} />
            </div>
          </article>
        ))}
      </section>

      <section id="submit" className={styles.submitSection}>
        <IdeaSubmitForm />
      </section>

      <a href="#submit" className={styles.floatingBtn}>
        ＋ 提交创意
      </a>
    </main>
  )
}
