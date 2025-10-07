import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import SharePlanDialog from './SharePlanDialog.vue'
import { usePlansStore } from 'src/stores/plans'

installQuasarPlugin()

type SharePlanDialogProps = ComponentProps<typeof SharePlanDialog>

const renderSharePlanDialog = (props: SharePlanDialogProps) => {
  return mount(SharePlanDialog, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
          initialState: {
            plans: {
              sharedUsers: [],
              userSearchResults: [],
              isSharing: false,
              isSearchingUsers: false,
              loadSharedUsers: vi.fn(),
              sharePlanWithUser: vi.fn(),
              updateUserPermission: vi.fn(),
              unsharePlanWithUser: vi.fn(),
              searchUsers: vi.fn(),
              clearUserSearch: vi.fn(),
            },
          },
        }),
      ],
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
    const wrapper = renderSharePlanDialog({ planId: 'p1', modelValue: true })
    expect(wrapper.exists()).toBe(true)
  })

  it('should pass props to ShareDialog', () => {
    const wrapper = renderSharePlanDialog({ planId: 'p1', modelValue: true })
    expect(wrapper.props('planId')).toBe('p1')
    expect(wrapper.props('modelValue')).toBe(true)
  })

  it('should emit update:modelValue when ShareDialog requests close', async () => {
    const wrapper = renderSharePlanDialog({ planId: 'p1', modelValue: true })
    const dialog = wrapper.find('.share-dialog .close')
    await dialog.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should emit shared when share is successful', async () => {
    const pinia = createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    const plansStore = usePlansStore(pinia)
    plansStore.sharePlanWithUser = vi.fn().mockResolvedValue({ success: true })

    const wrapper = mount(SharePlanDialog, {
      props: { planId: 'p1', modelValue: true },
      global: {
        plugins: [pinia],
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
