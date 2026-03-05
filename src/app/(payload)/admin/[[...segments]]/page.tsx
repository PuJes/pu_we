import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'

import { importMap } from '../../importMap'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  return RootPage({
    config,
    importMap,
    params: Promise.resolve({ segments: resolvedParams.segments ?? [] }),
    searchParams: Promise.resolve(
      resolvedSearchParams as {
        [key: string]: string | string[]
      },
    ),
  })
}
