import type { Metadata } from 'next'
import {
  ABeeZee,
  Inter_Tight,
  JetBrains_Mono,
  Manrope,
  Noto_Sans_SC,
  Noto_Serif_SC,
  Space_Grotesk,
} from 'next/font/google'

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

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const notoSerif = Noto_Serif_SC({
  variable: '--font-serif-sc',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const abeezee = ABeeZee({
  variable: '--font-abeezee',
  subsets: ['latin'],
  weight: ['400'],
})

export const metadata: Metadata = {
  title: 'JESS.PU',
  description: 'JESS.PU 个人站点首版 - Open Lab / AI / 商业分析 / 故事 / 订阅',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      className={`${interTight.variable} ${notoSC.variable} ${jetBrains.variable} ${spaceGrotesk.variable} ${notoSerif.variable} ${manrope.variable} ${abeezee.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
