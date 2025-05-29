import { type ErrorMessageKey, ERROR_MESSAGES } from 'src/config/error-messages'
import { useNotificationStore } from 'src/stores/notification'

type ErrorOptions = {
  notify?: boolean
  log?: boolean
  throw?: boolean
}

type ErrorContext = {
  action?: string
  component?: string
  userId?: string
  requestId?: string
  entityName?: string
  [key: string]: string | undefined
}

const DEFAULT_OPTIONS: Required<ErrorOptions> = {
  notify: true,
  log: true,
  throw: false,
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Unknown error occurred'
}

function getErrorConfig(
  errorKey: ErrorMessageKey,
  context?: ErrorContext,
): {
  message: string
  options: Required<ErrorOptions>
} {
  const config = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.UNKNOWN

  let message = config.message

  if (config.withEntityName && context?.entityName) {
    message = `${message}: ${context.entityName}`
  }

  const options: Required<ErrorOptions> = {
    ...DEFAULT_OPTIONS,
    notify: config.notify ?? DEFAULT_OPTIONS.notify,
    log: config.log ?? DEFAULT_OPTIONS.log,
    throw: config.throw ?? DEFAULT_OPTIONS.throw,
  }

  return {
    message,
    options,
  }
}

function formatErrorMessage(
  baseMessage: string,
  originalError: unknown,
  context?: ErrorContext,
  includeErrorMessage = false,
): string {
  let message = baseMessage

  // Add original error message if requested
  if (includeErrorMessage) {
    const errorMessage = extractErrorMessage(originalError)
    message = `${message}: ${errorMessage}`
  }

  // Add context information (excluding entityName as it's handled separately)
  const contextEntries = Object.entries(context || {})
    .filter(([key, value]) => key !== 'entityName' && value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)

  if (contextEntries.length > 0) {
    message = `${message} (${contextEntries.join(', ')})`
  }

  return message
}

function logError(message: string, originalError: unknown, context?: ErrorContext): void {
  const logData = {
    message,
    originalError: originalError instanceof Error ? originalError.message : originalError,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('[Error]', logData)
}

function notifyError(message: string): void {
  const notificationStore = useNotificationStore()
  notificationStore.showError(message)
}

export function useError() {
  function handleError(
    errorKey: ErrorMessageKey,
    error: unknown,
    context?: ErrorContext,
    options?: Partial<ErrorOptions>,
  ): string {
    const { message: baseMessage, options: defaultOptions } = getErrorConfig(errorKey, context)
    const config = ERROR_MESSAGES[errorKey]

    // Merge options: defaults < config < user provided
    const finalOptions = {
      ...defaultOptions,
      ...options,
    }

    const formattedMessage = formatErrorMessage(
      baseMessage,
      error,
      context,
      config?.includeErrorMessage,
    )

    if (finalOptions.log) {
      logError(formattedMessage, error, context)
    }

    if (finalOptions.notify) {
      notifyError(baseMessage)
    }

    if (finalOptions.throw) {
      throw new Error(formattedMessage)
    }

    return formattedMessage
  }

  return {
    handleError,
  }
}
