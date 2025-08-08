import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanItem from './PlanItem.vue'
import type { PlanItemUI } from 'src/types'

vi.mock('src/utils/currency', () => ({
  getCurrencySymbol: vi.fn((code: string) => (code === 'USD' ? '$' : code)),
}))

installQuasarPlugin()

type PlanItemProps = ComponentProps<typeof PlanItem>

const baseItem: PlanItemUI = {
  id: 'i1',
  name: 'Item 1',
  categoryId: 'c1',
  amount: 100,
  color: '#111',
}

const renderPlanItem = (props: PlanItemProps) => {
  return mount(PlanItem, {
    props,
    global: {
      stubs: {
        'q-item': { template: '<div><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-input': {
          template:
            '<input class="q-input" @input="$emit(\'update:model-value\', $event.target.value)" />',
          props: ['modelValue', 'readonly', 'rules', 'label', 'outlined', 'itemAligned', 'prefix'],
        },
        'q-btn': {
          template: '<button class="rm" @click="$emit(\'click\')"><slot /></button>',
          props: ['flat', 'round', 'dense', 'icon', 'color'],
        },
        'q-tooltip': { template: '<div />' },
      },
    },
  })
}

describe('PlanItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD' })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have defaults for readonly', () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD' })
    expect(wrapper.props('readonly')).toBe(false)
  })

  it('should emit update:modelValue on name change', async () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD' })
    const inputs = wrapper.findAll('.q-input')
    await inputs[0]?.setValue('New Name')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as PlanItemUI | undefined
    expect(emitted?.name).toBe('New Name')
  })

  it('should emit update:modelValue on amount change', async () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD' })
    const inputs = wrapper.findAll('.q-input')
    await inputs[1]?.setValue('250')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as PlanItemUI | undefined
    expect(emitted?.amount).toBe(250)
  })

  it('should not emit updates when readonly', async () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD', readonly: true })
    const inputs = wrapper.findAll('.q-input')
    await inputs[0]?.setValue('Ignored')
    await inputs[1]?.setValue('999')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('should emit remove when remove button is clicked', async () => {
    const wrapper = renderPlanItem({ modelValue: baseItem, currency: 'USD' })
    const rm = wrapper.find('.rm')
    await rm.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
  })
})
