import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanEditTab from './PlanEditTab.vue'

installQuasarPlugin()

type PlanEditTabProps = ComponentProps<typeof PlanEditTab>

const renderPlanEditTab = (props: PlanEditTabProps) => {
  return mount(PlanEditTab, {
    props,
    global: {
      stubs: {
        PlanInformationForm: { template: '<div class="plan-info-form" />' },
        CategoryItemsManager: {
          template:
            '<div class="category-items-manager"><slot name="category" :category="{}" /></div>',
        },
        PlanCategory: { template: '<div class="plan-category" />' },
        'q-form': { template: '<form @submit="$emit(\'submit\')"><slot /></form>' },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('PlanEditTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanEditTab({
      form: { name: '', startDate: '', endDate: '' },
      templateDuration: '',
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      lastAddedCategoryId: null,
      setCategoryRef: vi.fn(),
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should emit submit event on form submission', async () => {
    const wrapper = renderPlanEditTab({
      form: { name: 'Test', startDate: '2024-01-01', endDate: '2024-01-31' },
      templateDuration: 'monthly',
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      lastAddedCategoryId: null,
      setCategoryRef: vi.fn(),
    })

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('should emit update:form when form changes', () => {
    const wrapper = renderPlanEditTab({
      form: { name: '', startDate: '', endDate: '' },
      templateDuration: '',
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      lastAddedCategoryId: null,
      setCategoryRef: vi.fn(),
    })

    wrapper.vm.$emit('update:form', {
      name: 'New Name',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    })
    expect(wrapper.emitted('update:form')).toBeTruthy()
  })
})
