import { ZodError, type ZodSchema } from 'zod'

export function parseWithSchema<T>(schema: ZodSchema<T>, payload: unknown): T {
  try {
    return schema.parse(payload)
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues.map((issue) => issue.message).join('; ')
      throw new Error(message || 'Invalid input')
    }
    throw error
  }
}
