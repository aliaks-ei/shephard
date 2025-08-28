import { vi } from 'vitest'

/**
 * Sets up useError composable mock and returns the handleError spy
 */
export const setupErrorHandlingMock = () => {
  const mockHandleError = vi.fn()

  vi.mock('src/composables/useError', () => ({
    useError: vi.fn(() => ({
      handleError: mockHandleError,
    })),
  }))

  return mockHandleError
}

/**
 * Sets up useRouter mock with common router methods
 */
export const setupRouterMock = () => {
  const mockRouterPush = vi.fn()
  const mockRouterReplace = vi.fn()
  const mockRouterGo = vi.fn()
  const mockRouterBack = vi.fn()

  const mockRouter = {
    push: mockRouterPush,
    replace: mockRouterReplace,
    go: mockRouterGo,
    back: mockRouterBack,
  }

  vi.mock('vue-router', () => ({
    useRouter: vi.fn(() => mockRouter),
    useRoute: vi.fn(() => ({
      params: {},
      query: {},
      path: '/',
      name: 'test',
    })),
  }))

  return {
    mockRouter,
    mockRouterPush,
    mockRouterReplace,
    mockRouterGo,
    mockRouterBack,
  }
}

/**
 * Sets up useNonce composable mock
 */
export const setupNonceMock = (nonce: string = 'test-nonce-123') => {
  const mockGenerateNonce = vi.fn(() => nonce)

  vi.mock('src/composables/useNonce', () => ({
    useNonce: vi.fn(() => ({
      generateNonce: mockGenerateNonce,
    })),
  }))

  return { mockGenerateNonce, nonce }
}

/**
 * Sets up useTheme composable mock
 */
export const setupThemeMock = () => {
  const mockSetTheme = vi.fn()
  const mockToggleTheme = vi.fn()

  vi.mock('src/composables/useTheme', () => ({
    useTheme: vi.fn(() => ({
      setTheme: mockSetTheme,
      toggleTheme: mockToggleTheme,
      currentTheme: 'light',
    })),
  }))

  return {
    mockSetTheme,
    mockToggleTheme,
  }
}

/**
 * Generic helper to mock any composable
 */
export const mockComposable = <T extends Record<string, unknown>>(
  composablePath: string,
  mockImplementation: T,
): T => {
  vi.mock(composablePath, () => ({
    [composablePath.split('/').pop()!]: vi.fn(() => mockImplementation),
  }))

  return mockImplementation
}
