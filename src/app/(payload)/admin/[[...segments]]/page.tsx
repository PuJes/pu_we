import config from '@payload-config'
import { RootPage } from '@payloadcms/next/views'
import { redirect } from 'next/navigation'

import { resolvePayloadAdminEntryRedirect } from '@/lib/auth/admin'
import { importMap } from '../../importMap'

type AdminPageProps = {
  params: Promise<{ segments?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminPage({ params, searchParams }: AdminPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const rawSegments = resolvedParams.segments
  const normalizedSegments = (rawSegments ?? []).filter(
    (segment): segment is string => Boolean(segment),
  )
  const nextPath = normalizedSegments.length > 0 ? `/admin/${normalizedSegments.join('/')}` : '/admin'
  const search = new URLSearchParams()

  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          search.append(key, item)
        }
      })
      return
    }

    if (value) {
      search.set(key, value)
    }
  })

  const guardRedirect = await resolvePayloadAdminEntryRedirect(
    search.toString() ? `${nextPath}?${search.toString()}` : nextPath,
  )

  if (guardRedirect) {
    redirect(guardRedirect)
  }

  return RootPage({
    config,
    importMap,
    params: Promise.resolve(
      Array.isArray(rawSegments)
        ? { segments: normalizedSegments }
        : (resolvedParams as { segments: string[] }),
    ),
    searchParams: Promise.resolve(
      resolvedSearchParams as {
        [key: string]: string | string[]
      },
    ),
  })
}
