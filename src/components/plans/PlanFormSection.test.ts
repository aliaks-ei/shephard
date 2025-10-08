import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanFormSection from './PlanFormSection.vue'

installQuasarPlugin()

type PlanFormSectionProps = ComponentProps<typeof PlanFormSection>

const renderPlanFormSection = (props: PlanFormSectionProps) => {
  return mount(PlanFormSection, {
    props,
    global: {
      stubs: {
        PlanTemplateSelection: { template: '<div class="plan-template-selection" />' },
        PlanInformationForm: { template: '<div class="plan-info-form" />' },
        CategoryItemsManager: {
          template:
            '<div class="category-items-manager"><slot name="category" :category="{}" /></div>',
        },
        PlanCategory: { template: '<div class="plan-category" />' },
        'q-form': { template: '<form @submit="$emit(\'submit\')"><slot /></form>' },
      },
    },
  })
}

describe('PlanFormSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanFormSection({
      form: { name: '', startDate: '', endDate: '' },
      selectedTemplate: null,
      selectedTemplateOption: null,
      templateOptions: [],
      templatesLoading: false,
      templateError: false,
      templateErrorMessage: '',
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

  it('should emit submit on form submission', async () => {
    const wrapper = renderPlanFormSection({
      form: { name: 'Test', startDate: '2024-01-01', endDate: '2024-01-31' },
      selectedTemplate: null,
      selectedTemplateOption: null,
      templateOptions: [],
      templatesLoading: false,
      templateError: false,
      templateErrorMessage: '',
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
})
