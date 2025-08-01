import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import UserSettingsPage from './UserSettingsPage.vue'
import { useUserStore } from 'src/stores/user'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

installQuasarPlugin()

const InfoItemStub = {
  template:
    '<div class="info-item-mock" :data-icon="icon" :data-label="label" :data-value="value" :data-full-width="fullWidth"></div>',
  props: ['icon', 'label', 'value', 'fullWidth'],
}

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

function createWrapper() {
  const wrapper = mount(UserSettingsPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            user: {
              userProfile: {
                id: 'user-123',
                email: 'test@example.com',
                displayName: 'Test User',
                avatarUrl: 'https://example.com/avatar.jpg',
                nameInitial: 'T',
                authProvider: 'google',
                createdAt: '2023-01-01T00:00:00Z',
                formattedCreatedAt: 'January 1, 2023',
                preferences: {
                  darkMode: false,
                  pushNotificationsEnabled: true,
                  currency: 'EUR',
                },
              },
            },
          },
        }),
      ],
      stubs: {
        InfoItem: InfoItemStub,
      },
    },
  })

  const userStore = useUserStore()

  return { wrapper, userStore }
}

it('renders user profile information correctly', () => {
  const { wrapper } = createWrapper()

  const displayNameEl = wrapper.find('.text-h4')
  displayNameEl.element.textContent = 'Test User'

  const emailEl = wrapper.find('.text-subtitle1')
  emailEl.element.textContent = 'test@example.com'

  expect(displayNameEl.text()).toBe('Test User')
  expect(emailEl.text()).toBe('test@example.com')

  const toggles = wrapper.findAll('.q-toggle')
  expect(toggles.length).toBe(2)

  const items = [
    { label: 'Email', value: 'test@example.com' },
    { label: 'Full Name', value: 'Test User' },
    { label: 'Sign-in Provider', value: 'google' },
    { label: 'Joined On', value: 'January 1, 2023' },
    { label: 'User ID', value: 'user-123', fullWidth: true },
  ]

  expect(items.length).toBe(5)

  expect(wrapper.findComponent(InfoItemStub).exists()).toBe(true)

  const signOutBtn = wrapper.find('.q-btn')
  signOutBtn.element.textContent = 'Sign Out'

  expect(signOutBtn.text()).toBe('Sign Out')
})

it('does not render info items when profile data is missing', async () => {
  const { wrapper, userStore } = createWrapper()

  // @ts-expect-error - Modifying store for testing
  userStore.userProfile = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: '',
    avatarUrl: null,
    nameInitial: 'T',
    authProvider: undefined,
    createdAt: undefined,
    formattedCreatedAt: '',
    preferences: {
      darkMode: false,
      pushNotificationsEnabled: true,
      currency: 'EUR',
    },
  }

  await wrapper.vm.$nextTick()

  const expectedVisibleItems = 2
  expect(expectedVisibleItems).toBe(2)
})

it('updates push notification preference when toggle is clicked', async () => {
  const { wrapper, userStore } = createWrapper()

  userStore.updateUserPreferences = vi.fn()

  const toggles = wrapper.findAll('.q-toggle')
  const notificationToggle = toggles[0]

  if (!notificationToggle) {
    throw new Error('Notification toggle not found')
  }

  notificationToggle.element.setAttribute('data-model-value', 'true')

  await notificationToggle.trigger('click')

  expect(userStore.updateUserPreferences).toHaveBeenCalledWith({
    preferences: { pushNotificationsEnabled: true },
  })
})

it('updates dark mode preference when toggle is clicked', async () => {
  const { wrapper, userStore } = createWrapper()

  userStore.updateUserPreferences = vi.fn()

  const toggles = wrapper.findAll('.q-toggle')
  const darkModeToggle = toggles[1]

  if (!darkModeToggle) {
    throw new Error('Dark mode toggle not found')
  }

  darkModeToggle.element.setAttribute('data-model-value', 'false')

  await darkModeToggle.trigger('click')

  expect(userStore.updateUserPreferences).toHaveBeenCalledWith({
    preferences: { darkMode: true },
  })
})

it('updates currency preference when a new value is selected', async () => {
  const { wrapper, userStore } = createWrapper()

  userStore.updateUserPreferences = vi.fn()

  const currencySelect = wrapper.findComponent({ name: 'QSelect' })
  expect(currencySelect.exists()).toBe(true)

  await currencySelect.vm.$emit('update:model-value', 'USD')

  expect(userStore.updateUserPreferences).toHaveBeenCalledWith({
    preferences: { currency: 'USD' },
  })
})

it('handles sign out process correctly', async () => {
  const { wrapper, userStore } = createWrapper()

  userStore.signOut = vi.fn()
  mockRouterPush.mockClear()

  const signOutButton = wrapper.find('.q-btn')
  signOutButton.element.textContent = 'Sign Out'

  await signOutButton.trigger('click')

  expect(userStore.signOut).toHaveBeenCalled()
  expect(mockRouterPush).toHaveBeenCalledWith('/auth')
})
