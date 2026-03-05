import styles from '@/components/site/site-footer.module.css'

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
          <p className={styles.brand}>JESS.PU</p>
          <p className={styles.copy}>© 2026. All research reflects personal opinions only.</p>
        </div>
        <div className={styles.links}>
          <a href="#">X</a>
          <a href="#">GitHub</a>
          <a href="#">RSS</a>
        </div>
      </div>
    </footer>
  )
}
