import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import AuthCallbackPage from './AuthCallbackPage.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRoute: { query: Record<string, unknown> } = {
  query: {},
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => mockRoute,
}))

const mockGetSession = vi.fn()
vi.mock('src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}))

function createWrapper() {
  return mount(AuthCallbackPage, {
    global: {
      stubs: {
        QCard: {
          template: '<div class="q-card"><slot /></div>',
        },
        QCardSection: {
          template: '<div class="q-card-section"><slot /></div>',
        },
        QSpinner: {
          template: '<div class="q-spinner"></div>',
        },
        QIcon: {
          template: '<div class="q-icon"></div>',
        },
        QBtn: {
          template: '<button class="q-btn"><slot /></button>',
        },
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.query = {}
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: 'user-1' } } },
    error: null,
  })
})

it('should mount component properly', () => {
  const wrapper = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should redirect to home page on mount', async () => {
  createWrapper()
  await flushPromises()
  expect(mockRouterPush).toHaveBeenCalledWith('/')
})

it('should redirect to specified path when redirectTo query param exists', async () => {
  mockRoute.query = { redirectTo: '/plans' }
  createWrapper()
  await flushPromises()
  expect(mockRouterPush).toHaveBeenCalledWith('/plans')
})

it('should handle array type redirectTo query param', async () => {
  mockRoute.query = { redirectTo: ['/plans', '/fallback'] }
  createWrapper()
  await flushPromises()
  expect(mockRouterPush).toHaveBeenCalledWith('/plans')
})

it('should fallback to home for unsafe redirect values', async () => {
  mockRoute.query = { redirectTo: 'https://evil.example.com' }
  createWrapper()
  await flushPromises()
  expect(mockRouterPush).toHaveBeenCalledWith('/')
})

it('should show loading state initially', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('Verifying your login...')
})

it('should display welcome header', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('Welcome to Shephard')
})

it('should surface the provider error from the query string', async () => {
  mockRoute.query = { error_description: 'access_denied' }
  const wrapper = createWrapper()
  await flushPromises()
  expect(mockRouterPush).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('access_denied')
})

it('should surface a verification failure when session is missing', async () => {
  mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
  const wrapper = createWrapper()
  await flushPromises()
  expect(mockRouterPush).not.toHaveBeenCalled()
  expect(wrapper.text()).toContain('could not verify your sign-in')
})
