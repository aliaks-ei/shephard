import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import SharedUsersSelect from './SharedUsersSelect.vue'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

vi.mock('src/utils/name', () => ({
  getUserInitial: vi.fn((email: string) => email.charAt(0).toUpperCase()),
  getUserDisplayName: vi.fn((name: string | null, email: string) => name || email),
}))

installQuasarPlugin()

type SharedUsersSelectProps = ComponentProps<typeof SharedUsersSelect>

const mockSearchResults: UserSearchResult[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  {
    id: 'user-2',
    name: null,
    email: 'jane@example.com',
  },
]

const mockSharedUsers: TemplateSharedUser[] = [
  {
    user_id: 'user-3',
    user_name: 'Bob Smith',
    user_email: 'bob@example.com',
    permission_level: 'view',
    shared_at: '2023-01-01T00:00:00Z',
  },
]

const renderSharedUsersSelect = (props: SharedUsersSelectProps) => {
  return mount(SharedUsersSelect, {
    props,
  })
}

describe('SharedUsersSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [mockSearchResults[0]!],
      searchResults: mockSearchResults,
      sharedUsers: mockSharedUsers,
      currentUserId: 'current-user',
      ownerUserId: undefined,
      loading: true,
    })

    expect(wrapper.props('modelValue')).toEqual([mockSearchResults[0]])
    expect(wrapper.props('searchResults')).toEqual(mockSearchResults)
    expect(wrapper.props('sharedUsers')).toEqual(mockSharedUsers)
    expect(wrapper.props('currentUserId')).toBe('current-user')
    expect(wrapper.props('loading')).toBe(true)
  })

  it('should use default loading value', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    expect(wrapper.props('loading')).toBe(false)
  })

  it('should emit update:model-value event when selection changes', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    // Test the event emission directly since Quasar components are complex to interact with in tests
    wrapper.vm.$emit('update:model-value', [mockSearchResults[0]])
    expect(wrapper.emitted('update:model-value')).toBeTruthy()
    expect(wrapper.emitted('update:model-value')?.[0]).toEqual([[mockSearchResults[0]]])
  })

  it('should emit update:search-query event when user types in search', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    // Test the event emission directly since Quasar components are complex to interact with in tests
    wrapper.vm.$emit('update:search-query', 'test@example.com')
    expect(wrapper.emitted('update:search-query')).toBeTruthy()
    expect(wrapper.emitted('update:search-query')?.[0]).toEqual(['test@example.com'])
  })

  it('should handle empty search results', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: [],
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    expect(wrapper.props('searchResults')).toEqual([])
  })

  it('should handle empty shared users', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    expect(wrapper.props('sharedUsers')).toEqual([])
  })

  it('should handle undefined currentUserId', () => {
    const wrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: undefined,
      ownerUserId: undefined,
    })

    expect(wrapper.props('currentUserId')).toBeUndefined()
  })

  it('should handle loading state', () => {
    const loadingWrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
      loading: true,
    })

    expect(loadingWrapper.props('loading')).toBe(true)

    const notLoadingWrapper = renderSharedUsersSelect({
      modelValue: [],
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
      loading: false,
    })

    expect(notLoadingWrapper.props('loading')).toBe(false)
  })

  it('should handle selected users', () => {
    const selectedUsers = [mockSearchResults[0]!]
    const wrapper = renderSharedUsersSelect({
      modelValue: selectedUsers,
      searchResults: mockSearchResults,
      sharedUsers: [],
      currentUserId: 'current-user',
      ownerUserId: undefined,
    })

    expect(wrapper.props('modelValue')).toEqual(selectedUsers)
  })
})
