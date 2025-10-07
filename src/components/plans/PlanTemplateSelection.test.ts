import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanTemplateSelection from './PlanTemplateSelection.vue'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

type PlanTemplateSelectionProps = ComponentProps<typeof PlanTemplateSelection>

const mockTemplate = {
  id: 'template-1',
  name: 'Monthly Budget',
  duration: 'monthly',
  total: 1000,
  currency: 'USD',
  permission_level: 'edit',
  template_items: [],
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const renderPlanTemplateSelection = (props: PlanTemplateSelectionProps) => {
  return mount(PlanTemplateSelection, {
    props,
    global: {
      stubs: {
        SectionHeader: { template: '<div />' },
        TemplateCard: { template: '<div class="template-card" />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-select': {
          template:
            '<select @change="$emit(\'update:modelValue\', $event.target.value)"><slot /></select>',
          props: ['modelValue', 'options', 'loading', 'error'],
          emits: ['update:modelValue'],
        },
        'q-item': { template: '<div><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-badge': { template: '<span><slot /></span>' },
        'q-icon': { template: '<i />' },
      },
    },
  })
}

describe('PlanTemplateSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanTemplateSelection({
      modelValue: null,
      templateOptions: [],
      selectedTemplate: null,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display selected template', () => {
    const wrapper = renderPlanTemplateSelection({
      modelValue: 'template-1',
      templateOptions: [],
      selectedTemplate: mockTemplate,
    })

    const card = wrapper.find('.template-card')
    expect(card.exists()).toBe(true)
  })

  it('should emit update when template selected', () => {
    const wrapper = renderPlanTemplateSelection({
      modelValue: null,
      templateOptions: [],
      selectedTemplate: null,
    })

    wrapper.vm.$emit('update:modelValue', 'template-1')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should emit template-selected event', () => {
    const wrapper = renderPlanTemplateSelection({
      modelValue: null,
      templateOptions: [],
      selectedTemplate: null,
    })

    wrapper.vm.$emit('template-selected', 'template-1')
    expect(wrapper.emitted('template-selected')).toBeTruthy()
  })
})
