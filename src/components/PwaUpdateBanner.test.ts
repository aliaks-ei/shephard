import { beforeEach, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'

import PwaUpdateBanner from './PwaUpdateBanner.vue'

installQuasarPlugin()

const mockActivateUpdate = vi.fn()
const mockHasBlockingWork = ref(false)
const mockIsApplying = ref(false)
const mockIsUpdateAvailable = ref(false)

vi.mock('src/composables/usePwaUpdate', () => ({
  usePwaUpdate: () => ({
    activateUpdate: mockActivateUpdate,
    hasBlockingWork: mockHasBlockingWork,
    isApplying: mockIsApplying,
    isUpdateAvailable: mockIsUpdateAvailable,
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockHasBlockingWork.value = false
  mockIsApplying.value = false
  mockIsUpdateAvailable.value = false
})

it('stays hidden until an update is waiting', () => {
  const wrapper = mount(PwaUpdateBanner)

  expect(wrapper.text()).toBe('')
})

it('offers controlled activation when there is no open work', async () => {
  mockIsUpdateAvailable.value = true
  const wrapper = mount(PwaUpdateBanner)

  expect(wrapper.text()).toContain('A Shephard update is ready.')
  expect(wrapper.text()).toContain('Reload when you are ready')
  expect(wrapper.find('.pwa-update-banner__description').exists()).toBe(true)
  expect(wrapper.get('button').classes()).toContain('pwa-update-banner__action')

  await wrapper.get('button').trigger('click')
  expect(mockActivateUpdate).toHaveBeenCalledOnce()
})

it('disables activation while form or dialog work is open', () => {
  mockIsUpdateAvailable.value = true
  mockHasBlockingWork.value = true
  const wrapper = mount(PwaUpdateBanner)

  expect(wrapper.text()).toContain('Finish or close your open form or dialog')
  expect(wrapper.get('button').attributes('disabled')).toBeDefined()
})
