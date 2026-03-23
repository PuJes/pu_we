import type { NextRequest } from 'next/server'

export async function parseRequestBodyAsObject(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return (await request.json()) as Record<string, unknown>
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries())
  }

  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    const formData = await request.formData()
    return Object.fromEntries(formData.entries())
  }
}
