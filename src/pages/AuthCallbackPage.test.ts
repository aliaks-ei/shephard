import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import AuthCallbackPage from './AuthCallbackPage.vue'

installQuasarPlugin()

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
  expect(mockRouterPush).toHaveBeenCalledWith('/plans,/fallback')
})

it('should show loading state initially', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('Verifying your login...')
})

it('should display welcome header', () => {
  const wrapper = createWrapper()
  expect(wrapper.text()).toContain('Welcome to Shephard')
})
