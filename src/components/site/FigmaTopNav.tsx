import Link from 'next/link'

import styles from './figma-top-nav.module.css'

type MainLink = {
  href: string
  label: string
  key: 'home' | 'lab' | 'ai' | 'analysis' | 'story'
}

const mainLinks: MainLink[] = [
  { href: '/', label: '首页', key: 'home' },
  { href: '/lab', label: '实验室', key: 'lab' },
  { href: '/ai-experience', label: 'AI 经验', key: 'ai' },
  { href: '/analysis', label: '商业分析', key: 'analysis' },
  { href: '/story', label: '故事', key: 'story' },
]

type FigmaTopNavProps = {
  active?: MainLink['key']
  badge?: string
  compact?: boolean
  subscribePill?: boolean
}

export function FigmaTopNav({
  active,
  badge,
  compact = true,
  subscribePill = true,
}: FigmaTopNavProps) {
  return (
    <header className={`${styles.header} ${compact ? styles.compact : styles.tall}`}>
      <div className={styles.inner}>
        <div className={styles.brandWrap}>
          <Link href="/" className={styles.logo}>
            JESS.PU
          </Link>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
        </div>

        <nav className={styles.nav}>
          {mainLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={`${styles.link} ${active === link.key ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/subscribe"
          className={subscribePill ? styles.subscribePill : styles.subscribeOutline}
        >
          订阅
        </Link>
      </div>
    </header>
  )
}

export function IdeaTopNav() {
  return (
    <header className={`${styles.header} ${styles.compact}`}>
      <div className={styles.inner}>
        <div className={styles.ideaBrand}>
          <span className={styles.ideaLogoIcon} />
          <Link href="/" className={styles.logo}>
            JESS.PU
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/lab" className={`${styles.link} ${styles.active}`}>
            Idea 验证
          </Link>
          <Link href="/lab" className={styles.link}>
            公开实验室
          </Link>
          <Link href="/" className={styles.link}>
            项目
          </Link>
          <Link href="/" className={styles.link}>
            关于
          </Link>
        </nav>

        <Link href="#contribute" className={styles.ideaCta}>
          参与共创
        </Link>
      </div>
    </header>
  )
}
