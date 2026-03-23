import Link from 'next/link'

import styles from '@/components/site/site-footer.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.brand}>JESS.PU</p>
          <p className={styles.copy}>© 2026 JESS.PU · Build in Public.</p>
        </div>
        <nav className={styles.nav}>
          <Link href="/">首页</Link>
          <Link href="/lab">实验室</Link>
          <Link href="/ai-experience">AI 经验</Link>
          <Link href="/analysis">商业分析</Link>
          <Link href="/story">故事</Link>
          <Link href="/subscribe">订阅</Link>
        </nav>
        <div className={styles.social}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a>
          <a href="#" target="_blank" rel="noopener noreferrer">RSS</a>
        </div>
      </div>
    </footer>
  )
}
