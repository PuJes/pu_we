import Link from 'next/link'

import styles from '@/components/site/site-header.module.css'

const links = [
  { href: '/', label: '首页' },
  { href: '/lab', label: '实验室' },
  { href: '/ai-experience', label: 'AI 经验' },
  { href: '/analysis', label: '商业分析' },
  { href: '/story', label: '故事' },
]

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            JESS.PU
          </Link>
        </div>
        <nav className={styles.nav}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navItem}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.right}>
          <Link href="/subscribe" className={styles.subscribeBtn}>
            订阅
          </Link>
        </div>
      </div>
    </header>
  )
}
