import { getPublicSponsors } from '@/lib/data/queries'

import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function SubscribePage() {
  const sponsors = (await getPublicSponsors()) as Array<{ id: string; nickname: string }>

  return (
    <main className={`page-shell ${styles.page}`}>
      <header className={styles.header}>
        <h1 className="page-title">共同见证，一起同行</h1>
        <p className="page-subtitle">我们想在每一个里程碑时刻，即刻与你分享喜悦。</p>
      </header>

      <section className={styles.topGrid}>
        <article className={styles.newsletter}>
          <h2>咨询跟踪</h2>
          <p>独家分享公开构建过程中的失败案例、氛围编程工作流、以及私密的商业模式拆解。</p>
          <form action="/api/subscribe" method="post" className={styles.subscribeForm}>
            <input type="email" name="email" placeholder="your@email.com" />
            <button type="submit">获取验证码并订阅</button>
          </form>
          <small>无需绑定安全。随时可以退订。</small>
        </article>

        <article className={styles.chatCard}>
          <h3>来聊聊吧</h3>
          <p>商务合作或闲聊。</p>
          <div className={styles.qr}>QR</div>
          <strong>JESS_PU</strong>
          <span>添加请注明来自博客</span>
        </article>
      </section>

      <section className={styles.sponsorBoard}>
        <div className={styles.left}>
          <h2>请我喝杯咖啡</h2>
          <p>如果我的内容帮你节省了时间或解决了 Bug，欢迎请我喝杯咖啡支持创作。</p>
          <div className={styles.payBtns}>
            <button>微信支付</button>
            <button>支付宝</button>
          </div>
        </div>

        <div className={styles.right}>
          <p className={styles.sideTitle}>近期赞助名单</p>
          <div className={styles.sponsorGrid}>
            {sponsors.slice(0, 6).map((sponsor) => (
              <div key={sponsor.id} className={styles.sponsorItem}>
                <b>{sponsor.nickname.slice(0, 2).toUpperCase()}</b>
                <span>{sponsor.nickname}</span>
              </div>
            ))}
            <div className={styles.sponsorItem}>
              <b>…</b>
              <span>and more</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
