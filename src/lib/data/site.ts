import { cache } from 'react'

import { getPayloadClient } from '@/lib/payload'

export const getSiteSettings = cache(async () => {
  const payload = await getPayloadClient()

  try {
    const settings = await payload.findGlobal({ slug: 'siteSettings' })
    return settings
  } catch {
    return null
  }
})
