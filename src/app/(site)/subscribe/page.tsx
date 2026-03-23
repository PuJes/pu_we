import type { Metadata } from 'next'

import { SubscribeForm } from '@/components/forms/SubscribeForm'
import { FigmaTopNav } from '@/components/site/FigmaTopNav'
import { SiteFooter } from '@/components/site/SiteFooter'
import { getPublicSponsors } from '@/lib/data/queries'

import styles from './page.module.css'

export const metadata: Metadata = {
  title: '订阅与连接 — JESS.PU',
  description: '邮件订阅、微信联系、打赏支持。保持连接的三种方式。',
}

export const dynamic = 'force-dynamic'

export default async function SubscribePage() {
  const sponsors = (await getPublicSponsors()) as Array<{ id: string; nickname: string }>

  return (
    <>
      <FigmaTopNav active="story" badge="STORY" />
      <main className={`page-shell ${styles.page}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>共同见证，一起同行</h1>
          <p>我们想在每一个里程碑时刻，即刻与你分享喜悦。</p>
        </header>

        <section className={styles.topGrid}>
          <article className={styles.newsletter}>
            <h2>咨询跟踪</h2>
            <p>独家分享公开构建过程中的失败案例、氛围编程工作流、以及私密的商业模式拆解。每月一封，只发干货。</p>
            <SubscribeForm
              className={styles.subscribeForm}
              inputClassName={styles.subscribeInput}
              buttonClassName={styles.subscribeButton}
              feedbackClassName={styles.subscribeFeedback}
              buttonText="获取验证码并订阅"
              successText="订阅成功，后续将按月发送精选内容。"
            />
            <small>无密码更安全。随时可以退订。</small>
          </article>

          <article className={styles.chatCard}>
            <h3>来聊聊吧</h3>
            <p>商务合作或闲聊。</p>
            <div className={styles.qr}>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="10" width="30" height="30" rx="2" fill="#fff" fillOpacity="0.3" />
                <rect x="60" y="10" width="30" height="30" rx="2" fill="#fff" fillOpacity="0.3" />
                <rect x="10" y="60" width="30" height="30" rx="2" fill="#fff" fillOpacity="0.3" />
                <rect x="18" y="18" width="14" height="14" rx="1" fill="#fff" fillOpacity="0.6" />
                <rect x="68" y="18" width="14" height="14" rx="1" fill="#fff" fillOpacity="0.6" />
                <rect x="18" y="68" width="14" height="14" rx="1" fill="#fff" fillOpacity="0.6" />
                <rect x="60" y="60" width="10" height="10" rx="1" fill="#fff" fillOpacity="0.4" />
                <rect x="75" y="60" width="15" height="5" rx="1" fill="#fff" fillOpacity="0.3" />
                <rect x="60" y="75" width="5" height="15" rx="1" fill="#fff" fillOpacity="0.3" />
                <rect x="75" y="75" width="15" height="15" rx="1" fill="#fff" fillOpacity="0.2" />
                <text x="50" y="54" fill="#fff" fontSize="8" textAnchor="middle" fontFamily="monospace">扫码添加</text>
              </svg>
            </div>
            <strong>JESS_PU</strong>
            <span>添加请注明来自博客</span>
          </article>
        </section>

        <section className={styles.sponsorBoard}>
          <div className={styles.left}>
            <h2>请我喝杯咖啡</h2>
            <p>如果我的内容帮你节省了时间或解决了 Bug，欢迎请我喝杯咖啡支持创作。</p>
            <div className={styles.payBtns}>
              <button className={styles.wechatPay} title="微信支付（即将上线）">
                💬 微信支付
              </button>
              <button className={styles.alipay} title="支付宝（即将上线）">
                🔵 支付宝
              </button>
            </div>
            <p className={styles.payNotice}>支付功能即将上线，敬请期待 🚀</p>
          </div>

          <div className={styles.right}>
            <div className={styles.sideHead}>
              <p className={styles.sideTitle}>近期赞助名单</p>
              <span />
            </div>
            <div className={styles.sponsorGrid}>
              {sponsors.length === 0 ? (
                <p className={styles.sponsorEmpty}>虚位以待，成为第一个赞助者 ✨</p>
              ) : (
                <>
                  {sponsors.slice(0, 7).map((sponsor) => (
                    <div key={sponsor.id} className={styles.sponsorItem}>
                      <b>{sponsor.nickname.slice(0, 2).toUpperCase()}</b>
                      <span>{sponsor.nickname}</span>
                    </div>
                  ))}
                  <div className={styles.sponsorItem}>
                    <b>..</b>
                    <span>and more</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  )
}

