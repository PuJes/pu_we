export type FormApiResponse = {
  ok?: boolean
  data?: unknown
  error?: {
    code?: string
    message?: string
  }
}

export async function requestJson(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<{
  response: Response | null
  json: FormApiResponse | null
  networkError: boolean
}> {
  try {
    const response = await fetch(input, init)
    const raw = await response.text()
    let json: FormApiResponse | null = null

    if (raw) {
      try {
        json = JSON.parse(raw) as FormApiResponse
      } catch {
        json = null
      }
    }

    return {
      response,
      json,
      networkError: false,
    }
  } catch {
    return {
      response: null,
      json: null,
      networkError: true,
    }
  }
}
