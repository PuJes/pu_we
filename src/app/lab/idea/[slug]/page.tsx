import { notFound } from 'next/navigation'

import { CommentForm } from '@/components/forms/CommentForm'
import { FeatureSubmitForm } from '@/components/forms/FeatureSubmitForm'
import { getIdeaDetail } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const detail = await getIdeaDetail(slug)

  if (!detail) {
    notFound()
  }

  const { idea, features, comments } = detail

  return (
    <main className={styles.page}>
      <div className={`page-shell ${styles.shell}`}>
        <header className={styles.header}>
          <p className={styles.breadcrumb}>Idea / 脑暴与共创</p>
          <h1 className={styles.title}>{idea.title}</h1>
          <p className={styles.subtitle}>{idea.description}</p>
        </header>

        <section className={styles.mainGrid}>
          <aside className={styles.leftCol}>
            <article className={styles.box}>
              <h3>假设验证</h3>
              <ol>
                <li>你是否担心过自己突然离世后，社交账号和云端文件的去向？</li>
                <li>如果有工具能自动筛选“值得留下的记忆”，你愿意付费吗？</li>
              </ol>
              <div className={styles.voteRows}>
                <div>
                  <span>非常有压力，一直在想</span>
                  <em>42%</em>
                </div>
                <div>
                  <span>偶尔想到，但没行动</span>
                  <em>51%</em>
                </div>
                <div>
                  <span>完全不关心</span>
                  <em>7%</em>
                </div>
              </div>
            </article>

            <article className={styles.recruit}>
              <h4>共创者招募</h4>
              <p>如果你对数字永生、隐私和离线 AI 内容留存有浓厚兴趣，欢迎你加入。</p>
              <ul>
                <li>Backend (Python/Privacy focus)</li>
                <li>Product Designer (Empathy focus)</li>
              </ul>
              <a href="#">加入群聊 (Discord) →</a>
            </article>
          </aside>

          <section className={styles.rightCol}>
            <div className={styles.discussionHead}>
              <h3>共脑讨论区</h3>
              <a href="#">添加便签</a>
            </div>
            <div className={styles.stickyBoard}>
              {(features as unknown as Array<{ id: string | number; content: string }>)
                .slice(0, 6)
                .map((feature, index) => (
                <article key={feature.id} className={styles[`sticky${(index % 5) + 1}` as keyof typeof styles]}>
                  <p>{feature.content}</p>
                  <span>#{index + 1} @user</span>
                </article>
              ))}
            </div>
            <div className={styles.formArea}>
              <FeatureSubmitForm ideaId={String(idea.id)} />
              <CommentForm targetType="idea" targetId={String(idea.id)} />
            </div>

            <section className={styles.commentPanel}>
              <h4>已审核评论</h4>
              <div className={styles.commentList}>
                {(comments as unknown as Array<{ id: string | number; guestName?: string; content: string }>).map((item) => (
                  <article key={item.id}>
                    <b>@{item.guestName || '匿名用户'}</b>
                    <p>{item.content}</p>
                  </article>
                ))}
                {comments.length === 0 ? <p className={styles.empty}>暂时还没有评论。</p> : null}
              </div>
            </section>
          </section>
        </section>
      </div>
    </main>
  )
}
