import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ExpenseTemplateCategory from './ExpenseTemplateCategory.vue'
import type { ExpenseTemplateItemUI } from 'src/types'
import type { CurrencyCode } from 'src/utils/currency'

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

installQuasarPlugin()

type ExpenseTemplateCategoryProps = ComponentProps<typeof ExpenseTemplateCategory>

const mockItems: ExpenseTemplateItemUI[] = [
  {
    id: 'item-1',
    name: 'Test Item 1',
    categoryId: 'category-1',
    amount: 50,
    color: '#FF0000',
  },
  {
    id: 'item-2',
    name: 'Test Item 2',
    categoryId: 'category-1',
    amount: 30,
    color: '#FF0000',
  },
]

const renderExpenseTemplateCategory = (props: ExpenseTemplateCategoryProps) => {
  return mount(ExpenseTemplateCategory, {
    props,
    global: {
      stubs: {
        ExpenseTemplateItem: true,
      },
    },
  })
}

describe('ExpenseTemplateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props', () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
      readonly: true,
      defaultExpanded: false,
    })

    expect(wrapper.props('categoryId')).toBe('category-1')
    expect(wrapper.props('categoryName')).toBe('Food')
    expect(wrapper.props('categoryColor')).toBe('#FF0000')
    expect(wrapper.props('items')).toEqual(mockItems)
    expect(wrapper.props('subtotal')).toBe(80)
    expect(wrapper.props('currency')).toBe('USD')
    expect(wrapper.props('readonly')).toBe(true)
    expect(wrapper.props('defaultExpanded')).toBe(false)
  })

  it('should use default props', () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    expect(wrapper.props('readonly')).toBe(false)
    expect(wrapper.props('defaultExpanded')).toBe(false)
  })

  it('should emit update-item event when child item emits update', async () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    const templateItem = wrapper.findComponent({ name: 'ExpenseTemplateItem' })
    const updatedItem = { ...mockItems[0], name: 'Updated' }
    await templateItem.vm.$emit('update:model-value', updatedItem)
    expect(wrapper.emitted('update-item')).toBeTruthy()
    expect(wrapper.emitted('update-item')?.[0]).toEqual(['item-1', updatedItem])
  })

  it('should emit remove-item event when child item emits remove', async () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    const templateItem = wrapper.findComponent({ name: 'ExpenseTemplateItem' })
    await templateItem.vm.$emit('remove')
    expect(wrapper.emitted('remove-item')).toBeTruthy()
    expect(wrapper.emitted('remove-item')?.[0]).toEqual(['item-1'])
  })

  it('should emit add-item event when add button is clicked', async () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    const addButton = wrapper.find('button[aria-label="Add Item"], .q-btn:has([class*="plus"])')
    if (!addButton.exists()) {
      const buttons = wrapper.findAll('.q-btn')
      const addBtn = buttons.find((btn) => btn.text().includes('Add Item'))
      if (addBtn) {
        await addBtn.trigger('click')
      }
    } else {
      await addButton.trigger('click')
    }
    expect(wrapper.emitted('add-item')).toBeTruthy()
    expect(wrapper.emitted('add-item')?.[0]).toEqual(['category-1', '#FF0000'])
  })

  it('should handle empty items array', () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: [],
      subtotal: 0,
      currency: 'USD',
      categoryIcon: 'eva-pricetags-outline',
    })

    expect(wrapper.props('items')).toEqual([])
    expect(wrapper.props('subtotal')).toBe(0)
  })

  it('should handle different currencies', () => {
    const currencies = ['USD', 'EUR', 'GBP']

    currencies.forEach((currency) => {
      const wrapper = renderExpenseTemplateCategory({
        categoryId: 'category-1',
        categoryName: 'Food',
        categoryColor: '#FF0000',
        items: mockItems,
        subtotal: 80,
        currency: currency as CurrencyCode,
        categoryIcon: 'eva-pricetags-outline',
      })

      expect(wrapper.props('currency')).toBe(currency)
    })
  })

  it('should handle readonly mode', () => {
    const wrapper = renderExpenseTemplateCategory({
      categoryId: 'category-1',
      categoryName: 'Food',
      categoryColor: '#FF0000',
      items: mockItems,
      subtotal: 80,
      currency: 'USD',
      readonly: true,
      categoryIcon: 'eva-pricetags-outline',
    })

    expect(wrapper.props('readonly')).toBe(true)
  })
})
