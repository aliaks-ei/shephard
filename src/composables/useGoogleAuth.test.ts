import { vi, beforeEach, it, expect } from 'vitest'
import { useGoogleAuth } from './useGoogleAuth'
import type { GoogleSignInResponse } from 'src/types'
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router'

// Extend Window interface to include vueGoogleCallback
declare global {
  interface Window {
    vueGoogleCallback?: (response: GoogleSignInResponse) => void
  }
}

// Mock dependencies
vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}))

vi.mock('src/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('src/utils/csrf', () => ({
  getCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
  generateCsrfToken: vi.fn(),
}))

vi.mock('src/composables/useNonce', () => ({
  useNonce: vi.fn(),
}))

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'
import { getCsrfToken, clearCsrfToken, generateCsrfToken } from 'src/utils/csrf'
import { useNonce } from 'src/composables/useNonce'
import { useError } from 'src/composables/useError'

const mockRouterPush = vi.fn()
const mockRouter = {
  push: mockRouterPush,
}

const mockRoute = {
  query: {},
}

const mockAuthStore = {
  signInWithGoogle: vi.fn(),
}

const mockNonceComposable = {
  currentNonce: { value: null },
  isNonceReady: { value: true },
  hashedNonce: { value: 'mocked-hashed-nonce' },
  generateNonce: vi.fn(),
  resetNonce: vi.fn(),
  ensureFreshNonce: vi.fn(),
}

const mockErrorComposable = {
  handleError: vi.fn(),
}

beforeEach(() => {
  vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as Router)
  vi.mocked(useRoute).mockReturnValue(mockRoute as unknown as RouteLocationNormalizedLoaded)
  vi.mocked(useAuthStore).mockReturnValue(
    mockAuthStore as unknown as ReturnType<typeof useAuthStore>,
  )
  vi.mocked(useNonce).mockReturnValue(mockNonceComposable as unknown as ReturnType<typeof useNonce>)
  vi.mocked(useError).mockReturnValue(mockErrorComposable as unknown as ReturnType<typeof useError>)

  // Reset all mocks
  vi.clearAllMocks()

  // Clean up window object
  delete window.vueGoogleCallback
})

it('should return all expected properties', () => {
  const result = useGoogleAuth()

  expect(result).toHaveProperty('hashedNonce')
  expect(result).toHaveProperty('isNonceReady')
  expect(result).toHaveProperty('generateNonce')
  expect(result).toHaveProperty('initGoogleAuth')
  expect(result).toHaveProperty('handleGoogleSignIn')
  expect(result).toHaveProperty('cleanup')
})

it('should return properties from useNonce composable', () => {
  const result = useGoogleAuth()

  expect(result.hashedNonce).toBe(mockNonceComposable.hashedNonce)
  expect(result.isNonceReady).toBe(mockNonceComposable.isNonceReady)
  expect(result.generateNonce).toBe(mockNonceComposable.generateNonce)
})

it('initGoogleAuth should return early when ensureFreshNonce returns falsy', async () => {
  mockNonceComposable.ensureFreshNonce.mockResolvedValue(null)

  const { initGoogleAuth } = useGoogleAuth()
  await initGoogleAuth()

  expect(mockNonceComposable.ensureFreshNonce).toHaveBeenCalled()
  expect(generateCsrfToken).not.toHaveBeenCalled()
  expect(window.vueGoogleCallback).toBeUndefined()
})

it('initGoogleAuth should proceed when nonce is available', async () => {
  mockNonceComposable.ensureFreshNonce.mockResolvedValue('fresh-nonce')

  const { initGoogleAuth } = useGoogleAuth()
  await initGoogleAuth()

  expect(mockNonceComposable.ensureFreshNonce).toHaveBeenCalled()
  expect(generateCsrfToken).toHaveBeenCalled()
  expect(window.vueGoogleCallback).toBeDefined()
  expect(typeof window.vueGoogleCallback).toBe('function')
})

it('handleGoogleSignIn should throw error when CSRF token is missing', async () => {
  vi.mocked(getCsrfToken).mockReturnValue(null)

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockErrorComposable.handleError).toHaveBeenCalledWith(
    'AUTH.GOOGLE_SIGNIN_FAILED',
    expect.any(Error),
    { component: 'GoogleAuth' },
  )
})

it('handleGoogleSignIn should call authStore with correct parameters', async () => {
  const mockCsrfToken = 'mock-csrf-token'
  vi.mocked(getCsrfToken).mockReturnValue(mockCsrfToken)
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockAuthStore.signInWithGoogle).toHaveBeenCalledWith({
    ...mockResponse,
    csrfToken: mockCsrfToken,
  })
})

it('handleGoogleSignIn should return early when auth store returns falsy data', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue(null)

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockNonceComposable.resetNonce).not.toHaveBeenCalled()
  expect(clearCsrfToken).not.toHaveBeenCalled()
  expect(mockRouterPush).not.toHaveBeenCalled()
})

it('handleGoogleSignIn should cleanup and redirect on success', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockNonceComposable.resetNonce).toHaveBeenCalled()
  expect(clearCsrfToken).toHaveBeenCalled()
  expect(mockRouterPush).toHaveBeenCalledWith('/')
})

it('handleGoogleSignIn should redirect to query redirect path when present', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })
  mockRoute.query = { redirect: '/dashboard' }

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
})

it('handleGoogleSignIn should handle auth store errors', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  const mockError = new Error('Auth failed')
  mockAuthStore.signInWithGoogle.mockRejectedValue(mockError)

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockErrorComposable.handleError).toHaveBeenCalledWith(
    'AUTH.GOOGLE_SIGNIN_FAILED',
    mockError,
    { component: 'GoogleAuth' },
  )
})

it('handleGoogleSignIn should handle router navigation errors', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })
  const mockRouterError = new Error('Navigation failed')
  mockRouterPush.mockRejectedValue(mockRouterError)

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockErrorComposable.handleError).toHaveBeenCalledWith(
    'AUTH.GOOGLE_SIGNIN_FAILED',
    mockRouterError,
    { component: 'GoogleAuth' },
  )
})

it('cleanup should remove window callback when it exists', () => {
  window.vueGoogleCallback = vi.fn()

  const { cleanup } = useGoogleAuth()
  cleanup()

  expect(window.vueGoogleCallback).toBeUndefined()
})

it('cleanup should handle case when window callback does not exist', () => {
  expect(window.vueGoogleCallback).toBeUndefined()

  const { cleanup } = useGoogleAuth()
  expect(() => cleanup()).not.toThrow()
})

it('cleanup should call resetNonce and clearCsrfToken', () => {
  const { cleanup } = useGoogleAuth()
  cleanup()

  expect(mockNonceComposable.resetNonce).toHaveBeenCalled()
  expect(clearCsrfToken).toHaveBeenCalled()
})

it('cleanup should handle multiple cleanup calls safely', () => {
  window.vueGoogleCallback = vi.fn()

  const { cleanup } = useGoogleAuth()

  cleanup()
  expect(() => cleanup()).not.toThrow()

  expect(mockNonceComposable.resetNonce).toHaveBeenCalledTimes(2)
  expect(clearCsrfToken).toHaveBeenCalledTimes(2)
})

it('window callback should call handleGoogleSignIn', async () => {
  mockNonceComposable.ensureFreshNonce.mockResolvedValue('fresh-nonce')
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })

  const { initGoogleAuth } = useGoogleAuth()
  await initGoogleAuth()

  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  window.vueGoogleCallback?.(mockResponse)

  expect(mockAuthStore.signInWithGoogle).toHaveBeenCalledWith({
    ...mockResponse,
    csrfToken: 'csrf-token',
  })
})

it('should handle redirect query parameter as array', async () => {
  vi.mocked(getCsrfToken).mockReturnValue('csrf-token')
  mockAuthStore.signInWithGoogle.mockResolvedValue({ user: { id: '123' } })
  mockRoute.query = { redirect: ['/dashboard', '/profile'] }

  const { handleGoogleSignIn } = useGoogleAuth()
  const mockResponse: GoogleSignInResponse = {
    credential: 'mock-credential',
    select_by: 'btn',
  }

  await handleGoogleSignIn(mockResponse)

  expect(mockRouterPush).toHaveBeenCalledWith('/dashboard,/profile')
})
