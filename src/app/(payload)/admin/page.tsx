import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'

import { importMap } from '../importMap'

export default async function AdminRootPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams

  return RootPage({
    config,
    importMap,
    params: Promise.resolve({} as { segments: string[] }),
    searchParams: Promise.resolve(
      resolvedSearchParams as {
        [key: string]: string | string[]
      },
    ),
  })
}
