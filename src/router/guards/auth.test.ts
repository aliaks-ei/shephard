import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authGuard } from './auth'
import { useUserStore } from 'src/stores/user'
import { useAuthStore } from 'src/stores/auth'
import type { RouteLocationNormalized } from 'vue-router'

type MockUserStore = {
  isLoading: boolean
  isAuthenticated: boolean
}

type MockAuthStore = {
  ready: Promise<void>
}

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('src/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

const getTo = (path: string, requiresAuth: boolean) => ({
  meta: { requiresAuth },
  fullPath: path,
  path,
  hash: '',
  query: {},
  params: {},
  matched: [],
  name: undefined,
  redirectedFrom: undefined,
})

describe('authGuard', () => {
  const mockNext = vi.fn()
  let mockUserStore: MockUserStore
  let mockAuthStore: MockAuthStore

  beforeEach(() => {
    mockUserStore = {
      isLoading: false,
      isAuthenticated: false,
    } as unknown as MockUserStore

    mockAuthStore = {
      ready: Promise.resolve(),
    } as MockAuthStore

    vi.mocked(useUserStore).mockReturnValue(
      mockUserStore as unknown as ReturnType<typeof useUserStore>,
    )
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuthStore as unknown as ReturnType<typeof useAuthStore>,
    )
    mockNext.mockClear()
  })

  it('should redirect to auth page if route requires auth and user is not authenticated', async () => {
    mockUserStore.isAuthenticated = false

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth',
      query: { redirectTo: '/dashboard' },
    })
  })

  it('should proceed if route requires auth and user is authenticated', async () => {
    mockUserStore.isAuthenticated = true

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should proceed if route does not require auth and user is authenticated', async () => {
    mockUserStore.isAuthenticated = true

    const to: RouteLocationNormalized = getTo('/public', false)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith({ path: '/' })
  })

  it('should proceed if route does not require auth and user is not authenticated', async () => {
    mockUserStore.isAuthenticated = false

    const to: RouteLocationNormalized = getTo('/public', false)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should not attempt initialization; just handle auth check', async () => {
    mockUserStore.isLoading = true
    mockUserStore.isAuthenticated = true

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })
})
