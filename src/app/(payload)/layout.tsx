import type { ReactNode } from 'react'

import config from '@payload-config'
import { RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'

import { importMap } from './importMap'
import { serverFunction } from './serverFunction'

export default async function Layout({ children }: { children: ReactNode }) {
  return PayloadRootLayout({
    children,
    config,
    importMap,
    serverFunction,
  })
}
