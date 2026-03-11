import { mount, flushPromises } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'
import { ref } from 'vue'
import { Screen } from 'quasar'

import MainLayout from './MainLayout.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRouter = { push: mockRouterPush }

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({ fullPath: '/templates', params: {}, path: '/templates' }),
}))

vi.mock('src/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({
    isInstallable: ref(false),
    promptInstall: vi.fn(),
    dismissInstall: vi.fn(),
  }),
}))

type MainLayoutProps = ComponentProps<typeof MainLayout>

function setScreenWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  window.dispatchEvent(new Event('resize'))
}

const renderMainLayout = (props: MainLayoutProps = {}) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      auth: {
        isLoading: false,
        isAuthenticated: true,
        user: {
          id: 'user-1',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
          },
          created_at: new Date().toISOString(),
        },
      },
      preferences: {
        isLoading: false,
        preferences: {
          theme: 'auto',
          pushNotificationsEnabled: false,
          currency: 'USD',
        },
      },
    },
  })

  return mount(MainLayout, {
    props,
    global: {
      plugins: [pinia],
      stubs: {
        'router-view': true,
        PrivacyModeToggle: true,
        NavigationDrawer: {
          template: '<div data-testid="navigation-drawer" :items="items" />',
          props: ['items'],
        },
        MobileBottomNavigation: {
          template:
            '<button data-testid="mobile-bottom-navigation" @click="$emit(\'open-expense-dialog\')" />',
          emits: ['open-expense-dialog'],
        },
        ExpenseRegistrationDialog: {
          template: '<div data-testid="expense-dialog" />',
          props: ['modelValue', 'autoSelectRecentPlan'],
        },
      },
    },
  })
}

beforeEach(() => {
  Screen.setDebounce(0)
  setScreenWidth(1280)
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const wrapper = renderMainLayout()
  expect(wrapper.exists()).toBe(true)
})

it('should render header with toolbar', () => {
  const wrapper = renderMainLayout()

  const header = wrapper.find('header')
  const toolbar = wrapper.find('.q-toolbar')

  expect(header.exists()).toBe(true)
  expect(toolbar.exists()).toBe(true)
})

it('should render Shephard title button with correct attributes', () => {
  const wrapper = renderMainLayout()

  const shepherdButton = wrapper.find('.q-toolbar__title button')
  expect(shepherdButton.exists()).toBe(true)
  expect(shepherdButton.text()).toBe('Shephard')
  expect(shepherdButton.classes()).toContain('q-btn--no-uppercase')
})

it('should render router-view in page container', () => {
  const wrapper = renderMainLayout()

  const page = wrapper.find('.q-page')
  const routerView = wrapper.findComponent({ name: 'router-view' })

  expect(page.exists()).toBe(true)
  expect(routerView.exists()).toBe(true)
})

it('should render QDrawer with NavigationDrawer', () => {
  const wrapper = renderMainLayout()

  const drawer = wrapper.find('.q-drawer')
  expect(drawer.exists()).toBe(true)

  const navigationDrawer = wrapper.find('[data-testid="navigation-drawer"]')
  expect(navigationDrawer.exists()).toBe(true)
})

it('should not render expense dialog by default', () => {
  const wrapper = renderMainLayout()
  const expenseDialog = wrapper.find('[data-testid="expense-dialog"]')
  expect(expenseDialog.exists()).toBe(false)
})

it('should load expense dialog only after the mobile expense action is triggered', async () => {
  setScreenWidth(600)

  const wrapper = renderMainLayout()
  const mobileBottomNavigation = wrapper.find('[data-testid="mobile-bottom-navigation"]')

  expect(mobileBottomNavigation.exists()).toBe(true)
  expect(wrapper.find('[data-testid="expense-dialog"]').exists()).toBe(false)

  await mobileBottomNavigation.trigger('click')
  await flushPromises()

  expect(wrapper.find('[data-testid="expense-dialog"]').exists()).toBe(true)
})
