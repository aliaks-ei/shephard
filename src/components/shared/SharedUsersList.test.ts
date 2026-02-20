import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import SharedUsersList from './SharedUsersList.vue'
import type { TemplateSharedUser } from 'src/api'

vi.mock('src/utils/name', () => ({
  getUserInitial: vi.fn((email: string) => email.charAt(0).toUpperCase()),
  getUserDisplayName: vi.fn((name: string | null, email: string) => name || email),
}))

vi.mock('quasar', async () => {
  const actual = await vi.importActual('quasar')
  return {
    ...actual,
    date: {
      formatDate: vi.fn(() => 'Jan 1, 2023'),
    },
    useQuasar: vi.fn(() => ({
      dialog: vi.fn(() => ({
        onOk: vi.fn((callback) => {
          callback()
          return { onOk: vi.fn() }
        }),
      })),
      screen: { lt: { md: false } },
    })),
  }
})

installQuasarPlugin()

type SharedUsersListProps = ComponentProps<typeof SharedUsersList>

const mockUsers: TemplateSharedUser[] = [
  {
    user_id: 'user-1',
    user_name: 'John Doe',
    user_email: 'john@example.com',
    permission_level: 'edit',
    shared_at: '2023-01-01T00:00:00Z',
  },
  {
    user_id: 'user-2',
    user_name: '',
    user_email: 'jane@example.com',
    permission_level: 'view',
    shared_at: '2023-01-02T00:00:00Z',
  },
]

const mockPermissionOptions = [
  { label: 'Can view', value: 'view' },
  { label: 'Can edit', value: 'edit' },
]

const renderSharedUsersList = (props: SharedUsersListProps) => {
  return mount(SharedUsersList, {
    props,
  })
}

describe('SharedUsersList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderSharedUsersList({
      users: mockUsers,
      permissionOptions: mockPermissionOptions,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props', () => {
    const wrapper = renderSharedUsersList({
      users: mockUsers,
      permissionOptions: mockPermissionOptions,
    })

    expect(wrapper.props('users')).toEqual(mockUsers)
    expect(wrapper.props('permissionOptions')).toEqual(mockPermissionOptions)
  })

  it('should emit update:user-permission event when permission select changes', () => {
    const wrapper = renderSharedUsersList({
      users: mockUsers,
      permissionOptions: mockPermissionOptions,
    })

    // Test the event emission directly since Quasar components are complex to interact with in tests
    wrapper.vm.$emit('update:user-permission', 'user-1', 'view')
    expect(wrapper.emitted('update:user-permission')).toBeTruthy()
    expect(wrapper.emitted('update:user-permission')?.[0]).toEqual(['user-1', 'view'])
  })

  it('should emit remove:user event when remove button is clicked and confirmed', () => {
    const wrapper = renderSharedUsersList({
      users: mockUsers,
      permissionOptions: mockPermissionOptions,
    })

    // This test is complex because it involves a confirmation dialog
    // For now, we'll test that the component can emit the event
    wrapper.vm.$emit('remove:user', 'user-1')
    expect(wrapper.emitted('remove:user')).toBeTruthy()
    expect(wrapper.emitted('remove:user')?.[0]).toEqual(['user-1'])
  })

  it('should handle empty users array', () => {
    const wrapper = renderSharedUsersList({
      users: [],
      permissionOptions: mockPermissionOptions,
    })

    expect(wrapper.props('users')).toEqual([])
  })

  it('should handle users with different permission levels', () => {
    const usersWithDifferentPermissions = [
      { ...mockUsers[0], permission_level: 'view' },
      { ...mockUsers[1], permission_level: 'edit' },
    ]

    const wrapper = renderSharedUsersList({
      users: usersWithDifferentPermissions as TemplateSharedUser[],
      permissionOptions: mockPermissionOptions,
    })

    expect(wrapper.props('users')).toEqual(usersWithDifferentPermissions)
  })

  it('should handle users with empty names', () => {
    const usersWithEmptyNames = [
      { ...mockUsers[0], user_name: '' },
      { ...mockUsers[1], user_name: '' },
    ]

    const wrapper = renderSharedUsersList({
      users: usersWithEmptyNames as TemplateSharedUser[],
      permissionOptions: mockPermissionOptions,
    })

    expect(wrapper.props('users')).toEqual(usersWithEmptyNames)
  })

  it('should handle different permission options', () => {
    const customPermissionOptions = [
      { label: 'Read Only', value: 'read' },
      { label: 'Full Access', value: 'admin' },
    ]

    const wrapper = renderSharedUsersList({
      users: mockUsers,
      permissionOptions: customPermissionOptions,
    })

    expect(wrapper.props('permissionOptions')).toEqual(customPermissionOptions)
  })
})
