import type { Metadata } from 'next'
import { Inter_Tight, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

import '@/app/globals.css'

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
})

const notoSC = Noto_Sans_SC({
  variable: '--font-noto-sc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const jetBrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'JESS.PU',
  description: 'JESS.PU 个人站点首版 - Open Lab / AI / 商业分析 / 故事 / 订阅',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${interTight.variable} ${notoSC.variable} ${jetBrains.variable}`}
    >
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
