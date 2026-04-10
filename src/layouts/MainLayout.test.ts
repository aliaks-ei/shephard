import { mount, flushPromises } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'
import { ref } from 'vue'
import { Screen } from 'quasar'
import { defaultNotificationPushPreferences } from 'src/types/notifications'

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

vi.mock('src/composables/useNotifications', () => ({
  useNotifications: () => ({
    notifications: ref([]),
    unreadCount: ref(0),
    isLoading: ref(false),
    openNotification: vi.fn(),
    markAsRead: vi.fn(),
    removeNotification: vi.fn(),
    markAllAsRead: vi.fn(),
    clearAllNotifications: vi.fn(),
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
          pushNotificationsByType: { ...defaultNotificationPushPreferences },
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
        AppDialogShell: {
          template:
            '<div v-if="modelValue" data-testid="app-dialog-shell" :data-title="title" :data-subtitle="subtitle"><slot name="mobile-header-extra" /><slot /></div>',
          props: ['modelValue', 'title', 'subtitle', 'bodyClass', 'bodyScrollable'],
          emits: ['update:modelValue', 'hide', 'primary'],
        },
        NotificationInbox: {
          template:
            '<div data-testid="notification-inbox" :data-show-header="String(showHeader)" />',
          props: ['showHeader'],
        },
        NotificationInboxHeaderActions: {
          template: '<div data-testid="notification-header-actions" />',
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

it('should expose menu popup semantics for notifications on desktop', () => {
  const wrapper = renderMainLayout()
  const notificationsButton = wrapper.find('button[aria-label="Notifications"]')

  expect(notificationsButton.attributes('aria-haspopup')).toBe('menu')
  expect(notificationsButton.attributes('aria-expanded')).toBe('false')
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

it('should open notifications in the shared mobile dialog shell', async () => {
  setScreenWidth(600)

  const wrapper = renderMainLayout()
  const notificationsButton = wrapper.find('button[aria-label="Notifications"]')

  expect(notificationsButton.attributes('aria-haspopup')).toBe('dialog')
  expect(notificationsButton.attributes('aria-expanded')).toBe('false')
  expect(wrapper.find('[data-testid="app-dialog-shell"]').exists()).toBe(false)

  await notificationsButton.trigger('click')
  await flushPromises()

  const dialogShell = wrapper.find('[data-testid="app-dialog-shell"]')
  const notificationInbox = wrapper.find('[data-testid="notification-inbox"]')
  const headerActions = wrapper.find('[data-testid="notification-header-actions"]')

  expect(dialogShell.exists()).toBe(true)
  expect(dialogShell.attributes('data-title')).toBe('Notifications')
  expect(notificationInbox.attributes('data-show-header')).toBe('false')
  expect(headerActions.exists()).toBe(true)
  expect(notificationsButton.attributes('aria-expanded')).toBe('true')
})
