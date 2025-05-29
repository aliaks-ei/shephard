import { type ErrorMessageKey, ERROR_MESSAGES } from 'src/config/error-messages'
import { useNotificationStore } from 'src/stores/notification'

type ErrorOptions = {
  notify?: boolean
  log?: boolean
  throw?: boolean
}

/**
 * Get error message configuration for a given error key
 */
export function getErrorConfig(
  errorKey: ErrorMessageKey,
  entityName?: string,
): {
  message: string
  options: ErrorOptions
} {
  const config = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.UNKNOWN

  let message = config.message

  if (config.withEntityName && entityName) {
    message = `${message}: ${entityName}`
  }

  // Create options object only with defined properties
  const options: ErrorOptions = {}

  return {
    message,
    options,
  }
}

/**
 * Composable for error handling with notification display
 */
export function useError() {
  const notificationStore = useNotificationStore()

  /**
   * Handles errors by logging them and optionally showing a notification
   *
   * @param error The error object or message
   * @param contextOrKey A string describing where the error occurred or an error key from the error messages
   * @param options Additional options or entity name when using error key
   * @returns The formatted error message
   */
  function handleError(
    error: unknown,
    contextOrKey: string,
    options: {
      notify?: boolean
      log?: boolean
      throw?: boolean
      entityName?: string
    } = { notify: true, log: true, throw: false },
  ): string {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check if contextOrKey is an error key from our system
    const isErrorKey = contextOrKey in ERROR_MESSAGES

    let fullMessage: string
    let finalOptions = options

    if (isErrorKey) {
      // Using the error message system
      const errorKey = contextOrKey as ErrorMessageKey
      const { message, options: configOptions } = getErrorConfig(errorKey, options.entityName)

      fullMessage = message
      finalOptions = { ...configOptions, ...options }

      // Check if we need to include the original error message
      const config = ERROR_MESSAGES[errorKey]
      if (config && config.includeErrorMessage) {
        fullMessage = `${message}: ${errorMessage}`
      }
    } else {
      fullMessage = `${contextOrKey}: ${errorMessage}`
    }

    // Log the error
    if (finalOptions.log) {
      console.error(`[Error] ${fullMessage}`, error)
    }

    // Show notification
    if (finalOptions.notify) {
      notificationStore.showError(fullMessage)
    }

    // Throw the error if requested
    if (finalOptions.throw) {
      throw new Error(fullMessage)
    }

    return fullMessage
  }

  return {
    handleError,
  }
}
