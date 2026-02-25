export type Category = {
  id: string
  name: string
}

type RetryOptions<T> = {
  operation: () => Promise<T>
  maxAttempts?: number
  timeoutMs?: number
  baseDelayMs?: number
  retryableStatusCodes?: number[]
}

const DEFAULT_RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504]
const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_TIMEOUT_MS = 12000
const DEFAULT_BASE_DELAY_MS = 250

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export const normalizeCategoryName = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ')

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const isCategory = (value: unknown): value is Category =>
  isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string'

export const sortCategoriesDeterministically = (categories: Category[]): Category[] =>
  [...categories].sort((left, right) => {
    const leftNormalized = normalizeCategoryName(left.name)
    const rightNormalized = normalizeCategoryName(right.name)
    const nameComparison = leftNormalized.localeCompare(rightNormalized)

    if (nameComparison !== 0) {
      return nameComparison
    }

    return left.id.localeCompare(right.id)
  })

export const parseModelJsonObject = (
  outputText: string | null | undefined,
): Record<string, unknown> | null => {
  if (!outputText) {
    return null
  }

  const cleanedOutput = outputText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')

  try {
    const parsed = JSON.parse(cleanedOutput)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

const getErrorStatus = (error: unknown): number | null => {
  if (!isRecord(error)) {
    return null
  }

  if (typeof error.status === 'number') {
    return error.status
  }

  if (isRecord(error.response) && typeof error.response.status === 'number') {
    return error.response.status
  }

  return null
}

const isRetryableError = (error: unknown, retryableStatusCodes: Set<number>): boolean => {
  const status = getErrorStatus(error)
  if (status !== null) {
    return retryableStatusCodes.has(status)
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('temporarily unavailable')
    )
  }

  return false
}

const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`OpenAI request timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
    }
  }
}

export const createResponseWithRetry = async <T>({
  operation,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  baseDelayMs = DEFAULT_BASE_DELAY_MS,
  retryableStatusCodes = DEFAULT_RETRYABLE_STATUS_CODES,
}: RetryOptions<T>): Promise<T> => {
  const retryableStatusSet = new Set(retryableStatusCodes)
  let lastError: unknown = null

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await withTimeout(operation, timeoutMs)
    } catch (error) {
      lastError = error

      if (attempt >= maxAttempts - 1 || !isRetryableError(error, retryableStatusSet)) {
        throw error
      }

      const backoffDelay = baseDelayMs * 2 ** attempt
      const jitterMs = Math.floor(Math.random() * 100)
      await sleep(backoffDelay + jitterMs)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('OpenAI request failed')
}
