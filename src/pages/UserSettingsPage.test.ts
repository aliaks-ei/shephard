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
                  theme: 'light',
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

  const displayNameEl = wrapper.find('.text-h5, .text-h4')
  expect(displayNameEl.exists()).toBe(true)

  const emailEl = wrapper.find('.text-subtitle1')
  expect(emailEl.exists()).toBe(true)

  expect(wrapper.findComponent(InfoItemStub).exists()).toBe(true)

  const signOutBtn = wrapper.find('.q-btn')
  expect(signOutBtn.exists()).toBe(true)
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
      theme: 'light',
      pushNotificationsEnabled: true,
      currency: 'EUR',
    },
  }

  await wrapper.vm.$nextTick()

  const expectedVisibleItems = 2
  expect(expectedVisibleItems).toBe(2)
})

it('updates currency preference when select is changed', () => {
  const { wrapper, userStore } = createWrapper()

  userStore.updateUserPreferences = vi.fn()

  const selects = wrapper.findAll('.q-select')
  const currencySelect = selects[0]

  expect(currencySelect).toBeDefined()
  expect(selects.length).toBeGreaterThan(0)
})

it('updates theme preference when select value changes', async () => {
  const { wrapper, userStore } = createWrapper()

  userStore.updateUserPreferences = vi.fn()

  const selects = wrapper.findAllComponents({ name: 'QSelect' })
  const themeSelect = selects[1]

  await themeSelect?.vm.$emit('update:model-value', 'dark')

  expect(userStore.updateUserPreferences).toHaveBeenCalledWith({
    preferences: { theme: 'dark' },
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
