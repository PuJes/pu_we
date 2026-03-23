import type { Payload } from 'payload'

export async function upsertFrontendUser(payload: Payload, email: string) {
  const normalizedEmail = email.toLowerCase()
  const adminMatch = await payload.find({
    collection: 'admins',
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
    limit: 1,
    overrideAccess: true,
  })
  const role = adminMatch.totalDocs > 0 ? 'admin' : 'user'

  const existing = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
    limit: 1,
    overrideAccess: true,
  })

  const now = new Date().toISOString()

  if (existing.totalDocs > 0) {
    const current = existing.docs[0]
    const updated = await payload.update({
      collection: 'users',
      id: current.id,
      data: {
        lastLoginAt: now,
        role,
      },
      overrideAccess: true,
    })

    return updated
  }

  const nickname = `Geek_${Math.random().toString(16).slice(2, 6).toUpperCase()}`

  const created = await payload.create({
    collection: 'users',
    data: {
      email: normalizedEmail,
      nickname,
      role,
      isSubscribed: false,
      lastLoginAt: now,
    },
    overrideAccess: true,
  })

  return created
}
