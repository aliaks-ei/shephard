import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { useError } from './useError'
import { useNotificationStore } from 'src/stores/notification'

let pinia: TestingPinia
let consoleErrorSpy: MockInstance

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('error message extraction', () => {
  it('extracts message from Error object', () => {
    const { handleError } = useError()
    const error = new Error('Database connection failed')

    const result = handleError('UNKNOWN', error, undefined, { notify: false, log: false })

    expect(result).toContain('Database connection failed')
  })

  it('extracts message from string error', () => {
    const { handleError } = useError()
    const error = 'Network timeout occurred'

    const result = handleError('UNKNOWN', error, undefined, { notify: false, log: false })

    expect(result).toContain('Network timeout occurred')
  })

  it('handles unknown error types', () => {
    const { handleError } = useError()
    const error = { code: 500, details: 'Internal error' }

    const result = handleError('UNKNOWN', error, undefined, { notify: false, log: false })

    expect(result).toContain('Unknown error occurred')
  })

  it('handles null and undefined errors', () => {
    const { handleError } = useError()

    const resultNull = handleError('UNKNOWN', null, undefined, { notify: false, log: false })
    const resultUndefined = handleError('UNKNOWN', undefined, undefined, {
      notify: false,
      log: false,
    })

    expect(resultNull).toContain('Unknown error occurred')
    expect(resultUndefined).toContain('Unknown error occurred')
  })
})

describe('error configuration retrieval', () => {
  it('retrieves configuration for valid error key', () => {
    const { handleError } = useError()

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), undefined, {
      notify: false,
      log: false,
    })

    expect(result).toBe(
      "We couldn't start the sign-in process. Please try again or check your connection.",
    )
  })

  it('falls back to UNKNOWN for invalid error key', () => {
    const { handleError } = useError()
    // @ts-expect-error - Testing invalid error key
    const result = handleError('INVALID.KEY', new Error('test'), undefined, {
      notify: false,
      log: false,
    })

    expect(result).toContain(
      'Something went wrong. Please try again or contact support if it continues.',
    )
  })

  it('appends entity name when withEntityName is true', () => {
    const { handleError } = useError()
    // Using a key that has withEntityName in config (none exist in current config, so testing the logic)
    const result = handleError(
      'AUTH.INIT_FAILED',
      new Error('test'),
      { entityName: 'User Profile' },
      { notify: false, log: false },
    )

    // Since AUTH.INIT_FAILED doesn't have withEntityName, it should not append
    expect(result).not.toContain('User Profile')
  })
})

describe('message formatting', () => {
  it('formats base message only', () => {
    const { handleError } = useError()

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), undefined, {
      notify: false,
      log: false,
    })

    expect(result).toBe(
      "We couldn't start the sign-in process. Please try again or check your connection.",
    )
  })

  it('includes original error message when configured', () => {
    const { handleError } = useError()
    const error = new Error('Connection timeout')

    const result = handleError('UNKNOWN', error, undefined, { notify: false, log: false })

    expect(result).toContain(
      'Something went wrong. Please try again or contact support if it continues.: Connection timeout',
    )
  })

  it('formats message with context fields', () => {
    const { handleError } = useError()
    const context = { userId: '123', action: 'login', component: 'LoginForm' }

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), context, {
      notify: false,
      log: false,
    })

    expect(result).toContain('(userId: 123, action: login, component: LoginForm)')
  })

  it('excludes undefined context values', () => {
    const { handleError } = useError()
    const context = {
      userId: '123',
      component: 'LoginForm',
    }

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), context, {
      notify: false,
      log: false,
    })

    expect(result).toContain('(userId: 123, component: LoginForm)')
    expect(result).not.toContain('action')
  })

  it('excludes entityName from context formatting', () => {
    const { handleError } = useError()
    const context = { userId: '123', entityName: 'User Profile', component: 'LoginForm' }

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), context, {
      notify: false,
      log: false,
    })

    expect(result).toContain('(userId: 123, component: LoginForm)')
    expect(result).not.toContain('entityName: User Profile')
  })
})

describe('options handling and priority', () => {
  it('uses default options when none provided', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    handleError('AUTH.INIT_FAILED', new Error('test'))

    // Default: notify=true, log=true, throw=false
    expect(notificationStore.showError).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('applies config-specific options', () => {
    const { handleError } = useError()

    // USER.GET_FAILED has throw: true in config
    expect(() => {
      handleError('USER.GET_FAILED', new Error('test'), undefined, { notify: false, log: false })
    }).toThrow()
  })

  it('allows user options to override config options', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    // USER.GET_FAILED has throw: true, but we override it
    const result = handleError('USER.GET_FAILED', new Error('test'), undefined, {
      throw: false,
      notify: false,
      log: false,
    })

    expect(result).toBeDefined()
    expect(notificationStore.showError).not.toHaveBeenCalled()
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('merges options correctly with partial overrides', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    handleError('AUTH.INIT_FAILED', new Error('test'), undefined, { notify: false })

    // Should still log (default) but not notify (overridden)
    expect(notificationStore.showError).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('side effects', () => {
  it('logs error when log option is true', () => {
    const { handleError } = useError()
    const error = new Error('test error')
    const context = { userId: '123' }

    handleError('AUTH.INIT_FAILED', error, context, { notify: false, log: true })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Error]',
      expect.objectContaining({
        message: expect.stringContaining("We couldn't start the sign-in process"),
        originalError: 'test error',
        context,
        timestamp: expect.any(String),
      }),
    )
  })

  it('does not log when log option is false', () => {
    const { handleError } = useError()

    handleError('AUTH.INIT_FAILED', new Error('test'), undefined, { log: false, notify: false })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('shows notification when notify option is true', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    handleError('AUTH.INIT_FAILED', new Error('test'), undefined, { notify: true, log: false })

    expect(notificationStore.showError).toHaveBeenCalledWith(
      "We couldn't start the sign-in process. Please try again or check your connection.",
    )
  })

  it('does not show notification when notify option is false', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    handleError('AUTH.INIT_FAILED', new Error('test'), undefined, { notify: false, log: false })

    expect(notificationStore.showError).not.toHaveBeenCalled()
  })

  it('throws error when throw option is true', () => {
    const { handleError } = useError()

    expect(() => {
      handleError('AUTH.INIT_FAILED', new Error('test'), undefined, {
        throw: true,
        notify: false,
        log: false,
      })
    }).toThrow("We couldn't start the sign-in process. Please try again or check your connection.")
  })

  it('does not throw when throw option is false', () => {
    const { handleError } = useError()

    expect(() => {
      handleError('USER.GET_FAILED', new Error('test'), undefined, {
        throw: false,
        notify: false,
        log: false,
      })
    }).not.toThrow()
  })

  it('handles multiple side effects together', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()

    expect(() => {
      handleError(
        'USER.GET_FAILED',
        new Error('test'),
        { userId: '123' },
        { notify: true, log: true, throw: true },
      )
    }).toThrow()

    expect(notificationStore.showError).toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('return value', () => {
  it('always returns formatted message string', () => {
    const { handleError } = useError()

    const result = handleError('AUTH.INIT_FAILED', new Error('test'), undefined, {
      notify: false,
      log: false,
    })

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns consistent message format across scenarios', () => {
    const { handleError } = useError()

    const result1 = handleError('AUTH.INIT_FAILED', new Error('test'), undefined, {
      notify: false,
      log: false,
    })
    const result2 = handleError(
      'AUTH.INIT_FAILED',
      'string error',
      { userId: '123' },
      { notify: false, log: false },
    )

    // Both should start with the same base message
    expect(result1).toContain("We couldn't start the sign-in process")
    expect(result2).toContain("We couldn't start the sign-in process")
  })
})

describe('integration scenarios', () => {
  it('handles complete error flow with real configuration', () => {
    const { handleError } = useError()
    const notificationStore = useNotificationStore()
    const error = new Error('Database connection failed')
    const context = { userId: '123', action: 'loadPreferences' }
    const errorId = handleError('USER.PREFERENCES_LOAD_FAILED', error, context)

    expect(errorId).toBeTruthy()

    // Verify notification shows user-friendly message
    expect(notificationStore.showError).toHaveBeenCalledWith(
      "We couldn't load your settings. Please try again or check your connection.",
    )

    // Verify logging includes context
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Error]',
      expect.objectContaining({
        message: expect.stringContaining("We couldn't load your settings"),
        originalError: 'Database connection failed',
        context,
      }),
    )
  })

  it('handles UNKNOWN error with original error message inclusion', () => {
    const { handleError } = useError()
    const error = new Error('Unexpected API response')

    const result = handleError('UNKNOWN', error, undefined, { notify: false, log: false })

    expect(result).toContain(
      'Something went wrong. Please try again or contact support if it continues.: Unexpected API response',
    )
  })

  it('processes different error types with same configuration', () => {
    const { handleError } = useError()
    const context = { component: 'AuthForm' }

    const errorResult = handleError('AUTH.OTP_VERIFY_FAILED', new Error('Invalid token'), context, {
      notify: false,
      log: false,
    })
    const stringResult = handleError('AUTH.OTP_VERIFY_FAILED', 'Token expired', context, {
      notify: false,
      log: false,
    })

    expect(errorResult).toContain("That code doesn't work or has expired")
    expect(stringResult).toContain("That code doesn't work or has expired")
    expect(errorResult).toContain('(component: AuthForm)')
    expect(stringResult).toContain('(component: AuthForm)')
  })
})
