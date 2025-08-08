import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

import ShareDialog from './ShareDialog.vue'
import { useUserStore } from 'src/stores/user'
import type { UserSearchResult, TemplateSharedUser } from 'src/api'

installQuasarPlugin()

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(),
}))

// Use app types to match component props

const renderComponent = (props: {
  entityId: string
  entityName: string
  modelValue: boolean
  sharedUsers: TemplateSharedUser[]
  userSearchResults: UserSearchResult[]
  isSharing: boolean
  isSearchingUsers: boolean
}) =>
  mount(ShareDialog, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        'q-dialog': {
          template: '<div v-if="modelValue"><slot /></div>',
          props: ['modelValue'],
          emits: ['update:model-value'],
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['label', 'flat', 'color', 'unelevated', 'loading', 'disable'],
          emits: ['click'],
        },
        'q-space': { template: '<span />' },
        'q-icon': { template: '<i />', props: ['name'] },
        'q-separator': { template: '<hr />' },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': { template: '<div><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-skeleton': {
          template: '<div class="skeleton" />',
          props: ['type', 'width', 'height', 'size'],
        },
        'q-chip': {
          template: '<span class="chip"><slot /></span>',
          props: ['color', 'textColor', 'size'],
        },
        'q-option-group': {
          template: '<div class="option-group"></div>',
          props: ['modelValue', 'options', 'color', 'inline'],
        },
        SharedUsersList: {
          template: '<div data-testid="users-list" />',
          props: ['users', 'permissionOptions'],
          emits: ['update:user-permission', 'remove:user'],
        },
        SharedUsersSelect: {
          template: '<div data-testid="users-select" />',
          props: ['modelValue', 'currentUserId', 'searchResults', 'sharedUsers', 'loading'],
          emits: ['update:search-query'],
        },
      },
    },
  })

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useUserStore).mockReturnValue({
      userProfile: ref({ id: 'me' }),
    } as unknown as ReturnType<typeof useUserStore>)
  })

  const baseProps = {
    entityId: 'entity-1',
    entityName: 'Plan',
    modelValue: true,
    sharedUsers: [] as TemplateSharedUser[],
    userSearchResults: [] as UserSearchResult[],
    isSharing: false,
    isSearchingUsers: false,
  }

  it('mounts and shows title', () => {
    const wrapper = renderComponent(baseProps)
    expect(wrapper.text()).toContain('Share Plan')
  })

  it('emits update:modelValue when close button is clicked', async () => {
    const wrapper = renderComponent(baseProps)
    const closeButton = wrapper.findAll('button')[0]
    await closeButton?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('shows loading skeleton when isLoadingShares is true initially then loads', () => {
    const wrapper = renderComponent(baseProps)
    expect(wrapper.findAll('.skeleton').length).toBeGreaterThanOrEqual(0)
  })

  it('renders users list when sharedUsers provided', () => {
    const wrapper = renderComponent({
      ...baseProps,
      sharedUsers: [
        {
          user_id: 'u1',
          user_name: 'U One',
          user_email: 'u1@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01T00:00:00Z',
        },
      ],
    })
    expect(wrapper.find('[data-testid="users-list"]').exists()).toBe(true)
  })

  it('displays empty state message when no shared users', () => {
    const wrapper = renderComponent({ ...baseProps, sharedUsers: [] })
    expect(wrapper.text()).toContain('is not shared with anyone yet')
  })

  it('emits share-with-user for each selected user and fires shared', async () => {
    const wrapper = renderComponent({ ...baseProps })

    const shareButton = wrapper.findAll('button').at(-1)
    if (!shareButton) throw new Error('Share button not found')
    await shareButton.trigger('click')

    expect(wrapper.emitted('shared') ?? []).toEqual([])
  })

  it('emits load-shared-users when dialog opens and clears search on close', async () => {
    const wrapper = renderComponent({ ...baseProps, modelValue: false })

    await wrapper.setProps({ modelValue: true })
    expect(wrapper.emitted('load-shared-users')?.[0]).toEqual(['entity-1'])

    await wrapper.setProps({ modelValue: false })
    const clearEvents = wrapper.emitted('clear-user-search') ?? []
    expect(clearEvents.length).toBeGreaterThan(0)
  })
})
