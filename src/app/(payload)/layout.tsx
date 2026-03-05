import config from '@payload-config'
import { RootLayout } from '@payloadcms/next/layouts'
import type { ReactNode } from 'react'

import { importMap } from './importMap'
import { serverFunction } from './serverFunction'

export default async function Layout({ children }: { children: ReactNode }) {
  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
  })
}
