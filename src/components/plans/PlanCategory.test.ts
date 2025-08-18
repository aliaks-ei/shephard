import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanCategory from './PlanCategory.vue'
import type { PlanItemUI } from 'src/types'

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

installQuasarPlugin()

type PlanCategoryProps = ComponentProps<typeof PlanCategory>

const mockItems: PlanItemUI[] = [
  { id: 'i1', name: 'Item 1', categoryId: 'c1', amount: 100, color: '#111' },
  { id: 'i2', name: 'Item 2', categoryId: 'c1', amount: 50, color: '#222' },
]

const renderPlanCategory = (props: PlanCategoryProps) => {
  return mount(PlanCategory, {
    props,
    global: {
      stubs: {
        PlanItem: {
          template:
            '<div class="plan-item" @click="$emit(\'update:model-value\', $attrs.modelValue)" />',
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-expansion-item': {
          template: '<div><slot name="header" /><slot /></div>',
          props: ['modelValue', 'label', 'caption'],
        },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-avatar': { template: '<div><slot /></div>' },
        'q-icon': { template: '<i />' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-list': { template: '<div><slot /></div>' },
        'q-btn': {
          template: '<button class="q-btn" @click="$emit(\'click\')"><slot /></button>',
          props: ['flat', 'label', 'color'],
        },
      },
    },
  })
}

describe('PlanCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render header with name, count and subtotal', () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('USD 150.00')
  })

  it('should use defaults for optional props', () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: [],
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })
    expect(wrapper.props('readonly')).toBe(false)
    expect(wrapper.props('defaultExpanded')).toBe(false)
  })

  it('should emit add-item with category info', async () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })
    const addBtn = wrapper.find('.q-btn')
    await addBtn.trigger('click')
    expect(wrapper.emitted('add-item')).toBeTruthy()
    expect(wrapper.emitted('add-item')?.[0]).toEqual(['c1', '#f00'])
  })

  it('should hide add button in readonly mode', () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      readonly: true,
      categoryIcon: 'eva-pricetags-outline',
    })
    expect(wrapper.find('.q-btn').exists()).toBe(false)
  })

  it('should emit update-item when child updates', async () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })
    const item = wrapper.find('.plan-item')
    await item.trigger('click')
    expect(wrapper.emitted('update-item')).toBeTruthy()
  })

  it('should emit remove-item when child emits remove', async () => {
    const wrapper = mount(PlanCategory, {
      props: {
        categoryId: 'c1',
        categoryName: 'Food',
        categoryColor: '#f00',
        items: mockItems,
        currency: 'USD',
        categoryIcon: 'eva-pricetags-outline',
      },
      global: {
        stubs: {
          PlanItem: {
            template:
              '<div class="plan-item"><button class="rm" @click="$emit(\'remove\')" /></div>',
          },
          'q-card': { template: '<div><slot /></div>' },
          'q-expansion-item': {
            template: '<div><slot name="header" /><slot /></div>',
          },
          'q-item-section': { template: '<div><slot /></div>' },
          'q-item-label': { template: '<div><slot /></div>' },
          'q-avatar': { template: '<div><slot /></div>' },
          'q-icon': { template: '<i />' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-list': { template: '<div><slot /></div>' },
          'q-btn': { template: '<button class="q-btn" />' },
        },
      },
    })

    const removeButton = wrapper.find('.rm')
    await removeButton.trigger('click')
    expect(wrapper.emitted('remove-item')).toBeTruthy()
    expect(wrapper.emitted('remove-item')?.[0]).toEqual([mockItems[0]?.id])
  })

  it('should react to defaultExpanded changes', async () => {
    const wrapper = renderPlanCategory({
      categoryId: 'c1',
      categoryName: 'Food',
      categoryColor: '#f00',
      items: mockItems,
      currency: 'USD',
      defaultExpanded: false,
      categoryIcon: 'eva-pricetags-outline',
    })

    await wrapper.setProps({ defaultExpanded: true })
    expect(wrapper.props('defaultExpanded')).toBe(true)
  })
})
