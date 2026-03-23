type CommentAuthorUser = {
  nickname?: string | null
  email?: string | null
}

export type CommentAuthorInput = {
  guestName?: string | null
  authorUser?: number | CommentAuthorUser | null
}

function readNonEmpty(value?: string | null) {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function getCommentDisplayName(
  comment: CommentAuthorInput,
  fallback = '匿名用户',
) {
  const guestName = readNonEmpty(comment.guestName)
  if (guestName) {
    return guestName
  }

  if (comment.authorUser && typeof comment.authorUser === 'object') {
    return (
      readNonEmpty(comment.authorUser.nickname) ||
      readNonEmpty(comment.authorUser.email) ||
      '已验证用户'
    )
  }

  if (typeof comment.authorUser === 'number') {
    return '已验证用户'
  }

  return fallback
}
