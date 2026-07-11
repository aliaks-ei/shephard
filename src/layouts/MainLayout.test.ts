import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { vi, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'
import { computed, ref } from 'vue'
import { Screen, Notify } from 'quasar'
import { defaultNotificationPushPreferences } from 'src/types/notifications'

import MainLayout from './MainLayout.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRouter = { push: mockRouterPush }

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => ({ fullPath: '/templates', params: {}, path: '/templates' }),
}))

const mockIsInstallable = ref(false)
const mockIsIosInstallGuidanceAvailable = ref(false)

vi.mock('src/composables/usePwaInstall', () => ({
  usePwaInstall: () => ({
    isIosInstallGuidanceAvailable: mockIsIosInstallGuidanceAvailable,
    isInstallable: mockIsInstallable,
    promptInstall: vi.fn(),
    dismissInstall: vi.fn(),
  }),
}))

const mockHasSavedExpense = ref(false)
const mockHasShownInstallPromptThisSession = ref(false)
const mockCanShowInstallPrompt = computed(
  () => mockHasSavedExpense.value && !mockHasShownInstallPromptThisSession.value,
)
const mockMarkInstallPromptShown = vi.fn(() => {
  mockHasShownInstallPromptThisSession.value = true
})
const mockPlansForExpenses = ref([{ id: 'plan-1' }])
const mockIsOnline = ref(true)

vi.mock('src/composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: mockIsOnline,
    isOffline: ref(!mockIsOnline.value),
  }),
  startNetworkMonitoring: () => vi.fn(),
}))

vi.mock('src/composables/useInstallPromptGate', () => ({
  useInstallPromptGate: () => ({
    canShowInstallPrompt: mockCanShowInstallPrompt,
    hasSavedExpense: mockHasSavedExpense,
    hasShownInstallPromptThisSession: mockHasShownInstallPromptThisSession,
    markExpenseSaved: vi.fn(),
    markInstallPromptShown: mockMarkInstallPromptShown,
  }),
}))

vi.mock('src/queries/plans', () => ({
  usePlansQuery: () => ({
    plansForExpenses: mockPlansForExpenses,
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

const renderMainLayout = (props: MainLayoutProps = {}, authLoading = false) => {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      auth: {
        isLoading: authLoading,
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
  mockIsInstallable.value = false
  mockIsIosInstallGuidanceAvailable.value = false
  mockHasSavedExpense.value = false
  mockHasShownInstallPromptThisSession.value = false
  mockPlansForExpenses.value = [{ id: 'plan-1' }]
  mockIsOnline.value = true
})

it('should mount component properly', () => {
  const wrapper = renderMainLayout()
  expect(wrapper.exists()).toBe(true)
})

it('should show the persistent offline banner when disconnected', () => {
  mockIsOnline.value = false
  const wrapper = renderMainLayout()

  expect(wrapper.text()).toContain('You are offline')
  expect(wrapper.text()).toContain('changes require a connection')
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
  expect(notificationsButton.attributes('aria-controls')).toBe('notifications-menu')
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

it('should show a non-blocking content skeleton while the profile is loading', () => {
  const wrapper = renderMainLayout({}, true)

  expect(wrapper.find('.profile-bootstrap-skeleton').exists()).toBe(true)
  expect(wrapper.find('.q-inner-loading').exists()).toBe(false)
  expect(wrapper.findComponent({ name: 'router-view' }).exists()).toBe(false)
  expect(wrapper.find('header').exists()).toBe(true)
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

it('should not load expense dialog when no plan accepts expenses', async () => {
  mockPlansForExpenses.value = []
  setScreenWidth(600)

  const wrapper = renderMainLayout()
  await wrapper.find('[data-testid="mobile-bottom-navigation"]').trigger('click')
  await flushPromises()

  expect(wrapper.find('[data-testid="expense-dialog"]').exists()).toBe(false)
})

it('should open notifications in the shared mobile dialog shell', async () => {
  setScreenWidth(600)

  const wrapper = renderMainLayout()
  const notificationsButton = wrapper.find('button[aria-label="Notifications"]')

  expect(notificationsButton.attributes('aria-haspopup')).toBe('dialog')
  expect(notificationsButton.attributes('aria-expanded')).toBe('false')
  expect(notificationsButton.attributes('aria-controls')).toBe('notifications-dialog')
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

it('should include Activity in navigation items', () => {
  const wrapper = renderMainLayout()

  const navigationDrawer = wrapper.findComponent('[data-testid="navigation-drawer"]') as VueWrapper
  const items = (navigationDrawer.props() as Record<'items', unknown>).items as Array<{
    icon: string
    label: string
    to: string
  }>

  expect(items).toContainEqual({
    icon: 'eva-activity-outline',
    label: 'Activity',
    to: '/expenses',
  })
  expect(items.map((item) => item.to)).toEqual(['/', '/plans', '/expenses', '/templates'])
})

it('should not prompt install while the user has not saved an expense', async () => {
  const notifySpy = vi.spyOn(Notify, 'create').mockImplementation(() => () => {})

  renderMainLayout()

  mockIsInstallable.value = true
  await flushPromises()

  expect(notifySpy).not.toHaveBeenCalled()
  notifySpy.mockRestore()
})

it('should prompt install only when installable and an expense has been saved', async () => {
  const notifySpy = vi.spyOn(Notify, 'create').mockImplementation(() => () => {})

  renderMainLayout()

  mockHasSavedExpense.value = true
  await flushPromises()
  expect(notifySpy).not.toHaveBeenCalled()

  mockIsInstallable.value = true
  await flushPromises()

  // Wrappers from earlier tests stay mounted and share the mocked refs,
  // so assert the prompt fired rather than an exact call count.
  expect(notifySpy).toHaveBeenCalled()
  expect(notifySpy).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'Install Shephard for a better experience!' }),
  )
  expect(mockMarkInstallPromptShown).toHaveBeenCalled()
  notifySpy.mockRestore()
})

it('shows relevant iOS Add to Home Screen guidance only once per session', async () => {
  const notifySpy = vi.spyOn(Notify, 'create').mockImplementation(() => () => {})

  mockHasSavedExpense.value = true
  renderMainLayout()

  mockIsIosInstallGuidanceAvailable.value = true
  await flushPromises()

  expect(notifySpy).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Install Shephard: tap Share, then Add to Home Screen.',
    }),
  )
  expect(mockMarkInstallPromptShown).toHaveBeenCalledTimes(1)

  mockIsIosInstallGuidanceAvailable.value = false
  mockIsIosInstallGuidanceAvailable.value = true
  await flushPromises()

  expect(mockMarkInstallPromptShown).toHaveBeenCalledTimes(1)
  notifySpy.mockRestore()
})
