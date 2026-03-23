import { createHash } from 'node:crypto'

import slugify from 'slugify'

const NON_ASCII_PATTERN = /[^\u0000-\u007F]/

export function toSlug(value: string, fallbackPrefix = 'entry') {
  const normalized = value.trim()
  const baseSlug = slugify(normalized, {
    lower: true,
    strict: true,
    trim: true,
  })

  if (baseSlug && (!NON_ASCII_PATTERN.test(normalized) || baseSlug.length >= 6)) {
    return baseSlug
  }

  const shortHash = createHash('sha1').update(normalized).digest('hex').slice(0, 8)

  if (baseSlug) {
    return `${baseSlug}-${shortHash}`
  }

  return `${fallbackPrefix}-${shortHash}`
}
