import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import SharePlanDialog from './SharePlanDialog.vue'

installQuasarPlugin()

const mockMutateAsync = vi.fn().mockResolvedValue({ success: true })

vi.mock('src/queries/sharing', () => ({
  useSharedUsersQuery: vi.fn(() => ({
    data: ref([]),
    isPending: ref(false),
  })),
  useShareEntityMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: ref(false),
  })),
  useUnshareEntityMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useUpdatePermissionMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useSearchUsersQuery: vi.fn(() => ({
    data: ref([]),
    isPending: ref(false),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1' },
  })),
}))

type SharePlanDialogProps = ComponentProps<typeof SharePlanDialog>

const renderSharePlanDialog = (props: SharePlanDialogProps) => {
  return mount(SharePlanDialog, {
    props,
    global: {
      stubs: {
        ShareDialog: {
          template:
            '<div class="share-dialog"><button class="close" @click="$emit(\'update:model-value\', false)"></button><button class="shared" @click="handleShare"></button></div>',
          props: [
            'modelValue',
            'entityId',
            'entityName',
            'sharedUsers',
            'userSearchResults',
            'isSharing',
            'isSearchingUsers',
          ],
          emits: ['update:model-value', 'share-with-user'],
          methods: {
            handleShare() {
              this.$emit('share-with-user', 'plan-id', 'test@example.com', 'edit')
            },
          },
        },
      },
    },
  })
}

describe('SharePlanDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderSharePlanDialog({
      planId: 'p1',
      ownerUserId: undefined,
      modelValue: true,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should pass props to ShareDialog', () => {
    const wrapper = renderSharePlanDialog({
      planId: 'p1',
      ownerUserId: undefined,
      modelValue: true,
    })
    expect(wrapper.props('planId')).toBe('p1')
    expect(wrapper.props('modelValue')).toBe(true)
  })

  it('should emit update:modelValue when ShareDialog requests close', async () => {
    const wrapper = renderSharePlanDialog({
      planId: 'p1',
      ownerUserId: undefined,
      modelValue: true,
    })
    const dialog = wrapper.find('.share-dialog .close')
    await dialog.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should emit shared when share is successful', async () => {
    mockMutateAsync.mockResolvedValue({ success: true })

    const wrapper = mount(SharePlanDialog, {
      props: { planId: 'p1', ownerUserId: undefined, modelValue: true },
      global: {
        stubs: {
          ShareDialog: {
            template: '<div><button class="share-btn" @click="handleShare"></button></div>',
            props: ['modelValue'],
            emits: ['share-with-user'],
            methods: {
              handleShare() {
                this.$emit('share-with-user', 'p1', 'test@example.com', 'edit')
              },
            },
          },
        },
      },
    })

    const button = wrapper.find('.share-btn')
    await button.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('shared')).toBeTruthy()
  })
})
