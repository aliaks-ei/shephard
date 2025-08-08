import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import SharePlanDialog from './SharePlanDialog.vue'

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
            '<div class="share-dialog"><button class="close" @click="$emit(\'update:model-value\', false)"></button><button class="shared" @click="$emit(\'shared\')"></button></div>',
          props: [
            'modelValue',
            'entityId',
            'entityName',
            'sharedUsers',
            'userSearchResults',
            'isSharing',
            'isSearchingUsers',
          ],
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

  it('should emit shared when ShareDialog emits shared', async () => {
    const wrapper = renderSharePlanDialog({ planId: 'p1', modelValue: true })
    const button = wrapper.find('.share-dialog .shared')
    await button.trigger('click')
    expect(wrapper.emitted('shared')).toBeTruthy()
  })
})
