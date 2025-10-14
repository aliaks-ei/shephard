import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import MainLayout from './MainLayout.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRouter = { push: mockRouterPush }

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({ fullPath: '/templates', params: {} }),
}))

vi.mock('src/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({
    isInstallable: false,
    promptInstall: vi.fn(),
    dismissInstall: vi.fn(),
  }),
}))

type MainLayoutProps = ComponentProps<typeof MainLayout>

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
        UserDropdownMenu: true,
        UserAvatar: true,
        PrivacyModeToggle: true,
        NavigationDrawer: {
          template:
            '<div data-testid="navigation-drawer" :items="items" :is-mini-mode="isMiniMode" />',
          props: ['items', 'isMiniMode'],
        },
        MobileBottomNavigation: true,
        ExpenseRegistrationDialog: true,
        MobileUserDialog: true,
      },
    },
  })
}

beforeEach(() => {
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

it('should render UserDropdownMenu component', () => {
  const wrapper = renderMainLayout()

  const userDropdown = wrapper.findComponent({ name: 'UserDropdownMenu' })
  expect(userDropdown.exists()).toBe(true)
})

it('should render router-view in page container', () => {
  const wrapper = renderMainLayout()

  const pageContainer = wrapper.find('.page-container')
  const page = wrapper.find('.q-page')
  const routerView = wrapper.findComponent({ name: 'router-view' })

  expect(pageContainer.exists()).toBe(true)
  expect(page.exists()).toBe(true)
  expect(routerView.exists()).toBe(true)
})

it('should render sticky navigation with NavigationDrawer', () => {
  const wrapper = renderMainLayout()

  const stickyNav = wrapper.find('.q-page-sticky')
  expect(stickyNav.exists()).toBe(true)
  expect(stickyNav.classes()).toContain('navigation-sticky-bg')

  const stickyNavigationDrawer = stickyNav.find('[data-testid="navigation-drawer"]')
  expect(stickyNavigationDrawer.exists()).toBe(true)
  expect(stickyNavigationDrawer.attributes('is-mini-mode')).toBeDefined()
})

it('should render dialogs', () => {
  const wrapper = renderMainLayout()
  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  const mobileUserDialog = wrapper.findComponent({ name: 'MobileUserDialog' })
  expect(expenseDialog.exists()).toBe(true)
  expect(mobileUserDialog.exists()).toBe(true)
})

it('should render PrivacyModeToggle component', () => {
  const wrapper = renderMainLayout()
  const privacyToggle = wrapper.findComponent({ name: 'PrivacyModeToggle' })
  expect(privacyToggle.exists()).toBe(true)
})
