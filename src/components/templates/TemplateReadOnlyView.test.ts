import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import TemplateReadOnlyView from './TemplateReadOnlyView.vue'
import { createMockCategories } from 'test/fixtures'
import type { TemplateItemUI } from 'src/types'

installQuasarPlugin()

type TemplateReadOnlyViewProps = ComponentProps<typeof TemplateReadOnlyView>

const mockCategoryGroups = [
  {
    categoryId: 'cat-1',
    categoryName: 'Food',
    categoryColor: '#FF0000',
    categoryIcon: 'eva-pricetags-outline',
    subtotal: 8,
    items: [
      { id: 'item-1', name: 'Milk', categoryId: 'cat-1', amount: 5, color: '#FF0000' },
      { id: 'item-2', name: 'Bread', categoryId: 'cat-1', amount: 3, color: '#FF0000' },
    ] as TemplateItemUI[],
  },
]

const renderComponent = (props: TemplateReadOnlyViewProps) => {
  return mount(TemplateReadOnlyView, {
    props,
    global: {
      stubs: {
        TemplateBasicInfoSection: true,
        CategoryItemsManager: true,
        TemplateCategory: true,
      },
    },
  })
}

describe('TemplateReadOnlyView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      form: { name: 'Test Template', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should pass form data to TemplateBasicInfoSection', () => {
    const wrapper = renderComponent({
      form: { name: 'Test Template', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
    })
    const basicInfo = wrapper.findComponent({ name: 'TemplateBasicInfoSection' })
    expect(basicInfo.props('modelValue')).toEqual({
      name: 'Test Template',
      duration: 'weekly',
      currency: 'EUR',
    })
    expect(basicInfo.props('readonly')).toBe(true)
  })

  it('should pass category data to CategoryItemsManager', () => {
    const wrapper = renderComponent({
      form: { name: 'Test Template', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 150,
      currency: 'EUR',
      allExpanded: true,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    expect(manager.props('categoryGroups')).toEqual(mockCategoryGroups)
    expect(manager.props('totalAmount')).toBe(150)
    expect(manager.props('currency')).toBe('EUR')
    expect(manager.props('allExpanded')).toBe(true)
  })

  it('should emit toggle-expand event', async () => {
    const wrapper = renderComponent({
      form: { name: 'Test Template', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    await manager.vm.$emit('toggle-expand')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('should handle empty category groups', () => {
    const wrapper = renderComponent({
      form: { name: 'Empty Template', duration: 'monthly', currency: 'EUR' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should handle different currencies', () => {
    const currencies = ['USD', 'EUR', 'GBP']
    currencies.forEach((currency) => {
      const wrapper = renderComponent({
        form: { name: 'Test', duration: 'weekly', currency: 'EUR' },
        categoryGroups: mockCategoryGroups,
        categories: createMockCategories(),
        totalAmount: 100,
        currency: currency as 'USD' | 'EUR' | 'GBP',
        allExpanded: false,
      })
      const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
      expect(manager.props('currency')).toBe(currency)
    })
  })

  it('should pass show-duplicate-warning as false', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    expect(manager.props('showDuplicateWarning')).toBe(false)
  })

  it('should pass show-item-count as true', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly', currency: 'EUR' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    expect(manager.props('showItemCount')).toBe(true)
  })
})
