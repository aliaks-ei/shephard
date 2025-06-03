import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import AuthCallbackPage from './AuthCallbackPage.vue'
import { useUserStore } from 'src/stores/user'

installQuasarPlugin()

// Mock Vue Router
const mockRouterPush = vi.fn()
const mockRoute = {
  query: {},
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => mockRoute,
}))

// Setup for setTimeout
vi.useFakeTimers()

function createWrapper() {
  const wrapper = mount(AuthCallbackPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
        }),
      ],
      stubs: {
        QCard: true,
        QCardSection: true,
        QSpinner: true,
        QIcon: true,
        QBtn: true,
      },
    },
  })

  const userStore = useUserStore()

  return { wrapper, userStore }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.query = {}
})

it('should initialize user on mount', () => {
  const { userStore } = createWrapper()
  expect(userStore.initUser).toHaveBeenCalledOnce()
})

it('should redirect to home page after successful authentication', async () => {
  createWrapper()
  await flushPromises()
  vi.advanceTimersByTime(1500)
  expect(mockRouterPush).toHaveBeenCalledWith('/')
})

it('should redirect to specified path when redirectTo query param exists', async () => {
  mockRoute.query = { redirectTo: '/dashboard' }
  createWrapper()
  await flushPromises()
  vi.advanceTimersByTime(1500)
  expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
})

it('should handle array type redirectTo query param', async () => {
  mockRoute.query = { redirectTo: ['/dashboard', '/fallback'] }
  createWrapper()
  await flushPromises()
  vi.advanceTimersByTime(1500)
  expect(mockRouterPush).toHaveBeenCalledWith('/dashboard,/fallback')
})
