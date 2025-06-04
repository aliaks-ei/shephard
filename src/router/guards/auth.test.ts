import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authGuard } from './auth'
import { useUserStore } from 'src/stores/user'
import type { RouteLocationNormalized } from 'vue-router'

type MockUserStore = {
  isLoading: boolean
  isAuthenticated: boolean
  initUser: () => Promise<void>
}

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(),
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

  beforeEach(() => {
    mockUserStore = {
      isLoading: false,
      isAuthenticated: false,
      initUser: vi.fn().mockResolvedValue(undefined),
    } as unknown as MockUserStore

    vi.mocked(useUserStore).mockReturnValue(
      mockUserStore as unknown as ReturnType<typeof useUserStore>,
    )
    mockNext.mockClear()
  })

  it('should wait for user store to initialize if still loading', async () => {
    mockUserStore.isLoading = true

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockUserStore.initUser).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
  })

  it('should redirect to auth page if route requires auth and user is not authenticated', async () => {
    mockUserStore.isAuthenticated = false

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith({
      path: '/auth',
      query: { redirect: '/dashboard' },
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

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should proceed if route does not require auth and user is not authenticated', async () => {
    mockUserStore.isAuthenticated = false

    const to: RouteLocationNormalized = getTo('/public', false)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    await authGuard(to, from, mockNext)

    expect(mockNext).toHaveBeenCalledWith()
  })

  it('should handle loading state and authentication check in sequence', async () => {
    mockUserStore.isLoading = true
    mockUserStore.isAuthenticated = false

    const to: RouteLocationNormalized = getTo('/dashboard', true)
    const from: RouteLocationNormalized = {} as RouteLocationNormalized

    mockUserStore.initUser = vi.fn().mockImplementation(async () => {
      mockUserStore.isAuthenticated = true
      mockUserStore.isLoading = false
      return Promise.resolve()
    })

    await authGuard(to, from, mockNext)

    expect(mockUserStore.initUser).toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalledWith()
  })
})
