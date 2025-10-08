import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { it, expect, beforeEach, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { useUserStore } from 'src/stores/user'
import MobileUserDialog from './MobileUserDialog.vue'

installQuasarPlugin()

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

const UserAvatarMock = {
  name: 'UserAvatar',
  template: '<div class="user-avatar-mock"></div>',
  props: ['avatarUrl', 'nameInitial', 'size'],
}

function createWrapper(modelValue = true) {
  const wrapper = mount(MobileUserDialog, {
    props: {
      modelValue,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            user: {
              userProfile: {
                displayName: 'Test User',
                email: 'test@example.com',
                avatarUrl: 'https://example.com/avatar.jpg',
                nameInitial: 'T',
              },
            },
          },
        }),
      ],
      stubs: {
        UserAvatar: UserAvatarMock,
        QDialog: {
          template: '<div class="q-dialog" v-if="modelValue"><slot /></div>',
          props: ['modelValue', 'transitionShow', 'transitionHide'],
          emits: ['update:modelValue'],
        },
        QCard: { template: '<div class="q-card"><slot /></div>' },
        QCardSection: { template: '<div class="q-card-section"><slot /></div>' },
        QBtn: {
          template: '<button class="q-btn" @click="$emit(\'click\')"><slot /></button>',
          props: ['icon', 'flat', 'round', 'dense'],
          emits: ['click'],
        },
        QList: { template: '<div class="q-list"><slot /></div>' },
        QItem: {
          template: '<div class="q-item" :to="to" @click="$emit(\'click\')"><slot /></div>',
          props: ['clickable', 'to', 'exact'],
          emits: ['click'],
        },
        QItemSection: { template: '<div class="q-item-section"><slot /></div>', props: ['avatar'] },
        QIcon: { template: '<div class="q-icon"></div>', props: ['name', 'size', 'color'] },
        QSeparator: { template: '<hr class="q-separator" />' },
      },
    },
  })

  const userStore = useUserStore()

  return { wrapper, userStore }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('renders when modelValue is true', () => {
  const { wrapper } = createWrapper(true)
  expect(wrapper.find('.q-dialog').exists()).toBe(true)
})

it('does not render when modelValue is false', () => {
  const { wrapper } = createWrapper(false)
  expect(wrapper.find('.q-dialog').exists()).toBe(false)
})

it('renders UserAvatar component', () => {
  const { wrapper } = createWrapper()

  const avatar = wrapper.findComponent(UserAvatarMock)
  expect(avatar.exists()).toBe(true)
  expect(avatar.props('size')).toBe('72px')
})

it('has a close button that emits update:modelValue', async () => {
  const { wrapper } = createWrapper()

  const closeButton = wrapper.findAll('.q-btn').find((btn) => btn.classes('absolute'))
  await closeButton?.trigger('click')

  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
})

it('has a settings menu item with correct link', () => {
  const { wrapper } = createWrapper()

  const settingsItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Settings'))
  expect(settingsItem).toBeDefined()
  expect(settingsItem?.attributes('to')).toBe('/settings')
})

it('closes dialog when settings item is clicked', async () => {
  const { wrapper } = createWrapper()

  const settingsItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Settings'))
  await settingsItem?.trigger('click')

  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
})

it('has a sign out menu item', () => {
  const { wrapper } = createWrapper()

  const signOutItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Sign Out'))
  expect(signOutItem).toBeDefined()
  expect(signOutItem?.classes()).toContain('text-negative')
})

it('calls signOut and redirects when sign out is clicked', async () => {
  const { wrapper, userStore } = createWrapper()

  const signOutItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Sign Out'))
  await signOutItem?.trigger('click')

  expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])

  expect(userStore.signOut).toHaveBeenCalled()

  await flushPromises()
  expect(mockRouterPush).toHaveBeenCalledWith('/auth')
})
