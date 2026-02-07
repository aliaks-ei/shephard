import { mount } from '@vue/test-utils'
import { it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import NavigationDrawer from './NavigationDrawer.vue'

installQuasarPlugin()

const mockRoute = {
  fullPath: '/',
}

const mockRouterPush = vi.fn()

const mockUserStore = {
  userProfile: {
    displayName: 'Test User',
    email: 'test@example.com',
    avatarUrl: undefined,
    nameInitial: 'T',
  },
  signOut: vi.fn(),
}

const mockPreferencesStore = {
  isPrivacyModeEnabled: false,
  togglePrivacyMode: vi.fn(),
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

vi.mock('src/stores/preferences', () => ({
  usePreferencesStore: () => mockPreferencesStore,
}))

function createWrapper() {
  return mount(NavigationDrawer, {
    props: {
      items: [
        { icon: 'eva-home-outline', label: 'Home', to: '/' },
        { icon: 'eva-calendar-outline', label: 'Plans', to: '/plans' },
        { icon: 'eva-file-text-outline', label: 'Templates', to: '/templates' },
      ],
    },
    global: {
      stubs: {
        QList: { template: '<div class="q-list"><slot /></div>' },
        QItem: {
          template: '<div class="q-item" :to="to" :class="{ active: active }"><slot /></div>',
          props: ['to', 'active', 'clickable', 'exact'],
        },
        QItemSection: {
          template: '<div class="q-item-section"><slot /></div>',
          props: ['avatar'],
        },
        QIcon: {
          template: '<div class="q-icon">{{ name }}</div>',
          props: ['name', 'size', 'color'],
        },
        QSpace: { template: '<div class="q-space" />' },
        QSeparator: { template: '<div class="q-separator" />' },
        QBtn: {
          template: '<div class="q-btn"><slot /></div>',
          props: ['flat', 'noCaps', 'fullWidth', 'align'],
        },
        QMenu: { template: '<div class="q-menu"><slot /></div>' },
        UserAvatar: {
          template: '<div class="user-avatar">{{ nameInitial }}</div>',
          props: ['avatarUrl', 'nameInitial', 'size'],
        },
      },
    },
  })
}

function getNavItems(wrapper: ReturnType<typeof createWrapper>) {
  const navList = wrapper.findAll('.q-list')[0]!
  return navList.findAll('.q-item')
}

beforeEach(() => {
  mockRoute.fullPath = '/'
  mockPreferencesStore.isPrivacyModeEnabled = false
  vi.clearAllMocks()
})

it('renders all navigation items', () => {
  const wrapper = createWrapper()
  const items = getNavItems(wrapper)

  expect(items.length).toBe(3)
  expect(wrapper.text()).toContain('Home')
  expect(wrapper.text()).toContain('Plans')
  expect(wrapper.text()).toContain('Templates')
})

it('marks home as active when on home route', () => {
  mockRoute.fullPath = '/'
  const wrapper = createWrapper()

  const items = getNavItems(wrapper)
  const activeItems = items.filter((item) => item.classes().includes('active'))
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Home')
})

it('marks plans as active when on plans route', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const items = getNavItems(wrapper)
  const activeItems = items.filter((item) => item.classes().includes('active'))
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Plans')
})

it('marks plans as active when on plans subroute', () => {
  mockRoute.fullPath = '/plans/123'
  const wrapper = createWrapper()

  const items = getNavItems(wrapper)
  const activeItems = items.filter((item) => item.classes().includes('active'))
  expect(activeItems.length).toBeGreaterThan(0)
  expect(activeItems[0]?.text()).toContain('Plans')
})

it('does not mark home as active when on subroute', () => {
  mockRoute.fullPath = '/plans'
  const wrapper = createWrapper()

  const items = getNavItems(wrapper)
  const homeItem = items.find((item) => item.text().includes('Home'))
  expect(homeItem?.classes()).not.toContain('active')
})

it('renders icons with correct names', () => {
  const wrapper = createWrapper()
  const items = getNavItems(wrapper)
  const icons = items.map((item) => item.find('.q-icon').text())

  expect(icons[0]).toBe('eva-home-outline')
  expect(icons[1]).toBe('eva-calendar-outline')
  expect(icons[2]).toBe('eva-file-text-outline')
})

it('sets correct to attributes', () => {
  const wrapper = createWrapper()
  const items = getNavItems(wrapper)

  expect(items[0]?.attributes('to')).toBe('/')
  expect(items[1]?.attributes('to')).toBe('/plans')
  expect(items[2]?.attributes('to')).toBe('/templates')
})

it('renders user area with display name', () => {
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('Test User')
})

it('renders user email', () => {
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('test@example.com')
})

it('renders Settings link in user menu', () => {
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('Settings')
})

it('renders Sign Out option in user menu', () => {
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('Sign Out')
})

it('calls signOut and navigates to /auth when sign out is clicked', async () => {
  mockUserStore.signOut.mockResolvedValue(undefined)
  const wrapper = createWrapper()

  const signOutItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Sign Out'))

  await signOutItem?.trigger('click')
  await vi.waitFor(() => {
    expect(mockUserStore.signOut).toHaveBeenCalledOnce()
  })
  expect(mockRouterPush).toHaveBeenCalledWith('/auth')
})

it('calls togglePrivacyMode when privacy toggle is clicked', async () => {
  const wrapper = createWrapper()

  const privacyItem = wrapper
    .findAll('.q-item')
    .find((item) => item.text().includes('Hide amounts'))

  await privacyItem?.trigger('click')

  expect(mockPreferencesStore.togglePrivacyMode).toHaveBeenCalledOnce()
})

it('shows "Show amounts" label when privacy mode is enabled', () => {
  mockPreferencesStore.isPrivacyModeEnabled = true
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('Show amounts')
})

it('shows "Hide amounts" label when privacy mode is disabled', () => {
  mockPreferencesStore.isPrivacyModeEnabled = false
  const wrapper = createWrapper()

  expect(wrapper.text()).toContain('Hide amounts')
})
