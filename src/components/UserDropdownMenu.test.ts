import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { useUserStore } from 'src/stores/user'
import UserDropdownMenu from './UserDropdownMenu.vue'

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

function createWrapper() {
  const wrapper = mount(UserDropdownMenu, {
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
        QBtn: { template: '<button class="q-btn"><slot /></button>' },
        QMenu: { template: '<div class="q-menu"><slot /></div>' },
        QList: { template: '<div class="q-list"><slot /></div>' },
        QItem: {
          template:
            '<div :class="[\'q-item\', $attrs.class]" :to="to" @click="$emit(\'click\')"><slot /></div>',
          props: ['to', 'clickable', 'exact'],
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

describe('UserDropdownMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the UserAvatar component', () => {
    const { wrapper } = createWrapper()

    const avatar = wrapper.findComponent(UserAvatarMock)
    expect(avatar.exists()).toBe(true)
  })

  it('has a settings menu item with correct link', () => {
    const { wrapper } = createWrapper()

    const settingsItem = wrapper.findAll('.q-item').find((item) => item.text().includes('Settings'))

    expect(settingsItem).toBeDefined()
    expect(settingsItem?.attributes('to')).toBe('/settings')
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

    expect(userStore.signOut).toHaveBeenCalled()

    await flushPromises()
    expect(mockRouterPush).toHaveBeenCalledWith('/auth')
  })
})
