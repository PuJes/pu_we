import Link from 'next/link'

import type { ContentDoc } from '@/lib/data/queries'
import styles from '@/components/ui/cards.module.css'

export function ContentCard({ content }: { content: ContentDoc }) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.status}>{content.type}</span>
        <span className={styles.metric}>{content.category}</span>
      </div>
      <h3 className={styles.cardTitle}>{content.title}</h3>
      {content.snippet ? <p className={styles.cardDesc}>{content.snippet}</p> : null}
      {content.keyArgument ? <p className={styles.note}>Key: {content.keyArgument}</p> : null}
      {content.analysisFramework ? (
        <p className={styles.note}>Framework: {content.analysisFramework}</p>
      ) : null}
      {content.takeaways?.length ? (
        <ul className={styles.tags}>
          {content.takeaways.slice(0, 3).map((item, index) => (
            <li key={`${content.id}-takeaway-${index}`}>{item.item}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.actionsRow}>
        <Link href={`/api/contents/${content.slug}`} className={styles.linkButton}>
          查看接口数据
        </Link>
        <Link href="/subscribe" className={styles.ghostButton}>
          ☕ 打赏
        </Link>
      </div>
    </article>
  )
}
