import Link from 'next/link'

import type { IdeaDoc } from '@/lib/data/queries'
import styles from '@/components/ui/cards.module.css'
import { VoteButton } from '@/components/forms/VoteButton'

export function IdeaCard({ idea }: { idea: IdeaDoc }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.status}>{idea.status}</span>
        <span className={styles.metric}>{idea.voteCount} votes</span>
      </div>
      <h3 className={styles.cardTitle}>{idea.title}</h3>
      <p className={styles.cardDesc}>{idea.description}</p>
      <div className={styles.actionsRow}>
        <Link href={`/lab/idea/${idea.slug}`} className={styles.linkButton}>
          查看详情
        </Link>
        <VoteButton ideaId={idea.id} initialCount={idea.voteCount} />
      </div>
    </article>
  )
}
