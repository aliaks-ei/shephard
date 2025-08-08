import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import ActionsFab from './ActionsFab.vue'

installQuasarPlugin()

type FabAction = {
  key: string
  icon: string
  label: string
  color: string
  loading?: boolean
  visible?: boolean
  handler: () => void | Promise<void>
}

const renderComponent = (props: { modelValue: boolean; visible?: boolean; actions: FabAction[] }) =>
  mount(ActionsFab, {
    props,
    global: {
      stubs: {
        'q-page-sticky': { template: '<div><slot /></div>' },
        'q-fab': {
          template: '<div data-testid="fab"><slot /></div>',
          props: [
            'modelValue',
            'icon',
            'activeIcon',
            'direction',
            'color',
            'label',
            'labelPosition',
            'labelClass',
            'verticalActionsAlign',
          ],
        },
        'q-fab-action': {
          template: '<button class="fab-action" @click="$emit(\'click\')"><slot /></button>',
          props: [
            'icon',
            'externalLabel',
            'label',
            'labelPosition',
            'labelClass',
            'color',
            'loading',
          ],
          emits: ['click'],
        },
      },
    },
  })

describe('ActionsFab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when visible is true and hides when false', () => {
    const wrapperVisible = renderComponent({
      modelValue: false,
      visible: true,
      actions: [],
    })
    expect(wrapperVisible.find('[data-testid="fab"]').exists()).toBe(true)

    const wrapperHidden = renderComponent({
      modelValue: false,
      visible: false,
      actions: [],
    })
    expect(wrapperHidden.find('[data-testid="fab"]').exists()).toBe(false)
  })

  it('filters out actions with visible set to false', () => {
    const actions: FabAction[] = [
      { key: 'a', icon: 'i', label: 'A', color: 'primary', handler: vi.fn() },
      { key: 'b', icon: 'i', label: 'B', color: 'primary', visible: false, handler: vi.fn() },
      { key: 'c', icon: 'i', label: 'C', color: 'primary', handler: vi.fn() },
    ]
    const wrapper = renderComponent({ modelValue: false, visible: true, actions })
    expect(wrapper.findAll('.fab-action').length).toBe(2)
  })

  it('emits update:modelValue=false and action-clicked on action click, and calls handler', async () => {
    const handler = vi.fn()
    const actions: FabAction[] = [{ key: 'go', icon: 'i', label: 'Go', color: 'primary', handler }]
    const wrapper = renderComponent({ modelValue: true, visible: true, actions })

    const button = wrapper.get('.fab-action')
    await button.trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    expect(wrapper.emitted('action-clicked')?.[0]).toEqual(['go'])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('handles empty actions array gracefully', () => {
    const wrapper = renderComponent({ modelValue: false, visible: true, actions: [] })
    expect(wrapper.findAll('.fab-action').length).toBe(0)
  })
})
