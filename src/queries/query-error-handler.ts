import { useError } from 'src/composables/useError'
import type { ErrorMessageKey } from 'src/config/error-messages'

export function createMutationErrorHandler(errorKey: ErrorMessageKey) {
  return (error: Error) => {
    const { handleError } = useError()
    handleError(errorKey, error)
  }
}

type ErrorCondition = {
  check: (error: Error) => boolean
  key: ErrorMessageKey
}

export function createSpecificErrorHandler(
  handlers: ErrorCondition[],
  defaultKey: ErrorMessageKey,
) {
  return (error: Error) => {
    const { handleError } = useError()

    for (const handler of handlers) {
      if (handler.check(error)) {
        handleError(handler.key, error)
        return
      }
    }

    handleError(defaultKey, error)
  }
}
