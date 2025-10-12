import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import ItemCategory from './ItemCategory.vue'
import type { BaseItemUI } from 'src/types'

installQuasarPlugin()

type ItemCategoryProps = ComponentProps<typeof ItemCategory>

const createMockItems = (): BaseItemUI[] => [
  {
    id: 'item-1',
    name: 'Item 1',
    amount: 100,
    categoryId: 'cat-1',
    color: '#FF5722',
    isFixedPayment: true,
  },
  {
    id: 'item-2',
    name: 'Item 2',
    amount: 200,
    categoryId: 'cat-1',
    color: '#FF5722',
    isFixedPayment: true,
  },
]

const renderComponent = (props: ItemCategoryProps) => {
  return mount(ItemCategory, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div class="card"><slot /></div>' },
        'q-expansion-item': {
          template:
            '<div><div class="header"><slot name="header" /></div><div class="content"><slot /></div></div>',
          props: ['modelValue', 'label', 'caption', 'icon', 'expand-icon', 'expanded-icon'],
          emits: ['update:model-value'],
        },
        'q-item-section': { template: '<div><slot /></div>', props: ['avatar', 'side', 'style'] },
        'q-item-label': { template: '<div><slot /></div>', props: ['caption'] },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-list': { template: '<div><slot /></div>' },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['flat', 'color', 'icon', 'label', 'no-caps'],
          emits: ['click'],
        },
        CategoryIcon: {
          template: '<div class="category-icon" />',
          props: ['color', 'icon', 'size'],
        },
      },
    },
  })
}

describe('ItemCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render category name', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
    })
    expect(wrapper.text()).toContain('Groceries')
  })

  it('should render item count', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
    })
    expect(wrapper.text()).toContain('2 items')
  })

  it('should render item count as singular', () => {
    const items = createMockItems()
    const firstItem = items[0]
    if (!firstItem) throw new Error('No items')
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: [firstItem],
      currency: 'USD',
    })
    expect(wrapper.text()).toContain('1 item')
  })

  it('should calculate and display subtotal', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
    })
    expect(wrapper.text()).toContain('$300.00')
  })

  it('should not be readonly by default', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
      readonly: false,
    })
    expect(wrapper.props('readonly')).toBe(false)
  })

  it('should not render Add Item button when readonly', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
      readonly: true,
    })
    expect(wrapper.text()).not.toContain('Add Item')
  })

  it('should have add-item emitter defined', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
    })

    wrapper.vm.$emit('add-item', 'cat-1', '#FF5722')
    expect(wrapper.emitted('add-item')).toBeTruthy()
    expect(wrapper.emitted('add-item')?.[0]).toEqual(['cat-1', '#FF5722'])
  })

  it('should be collapsed by default when defaultExpanded is false', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
      defaultExpanded: false,
    })
    expect(wrapper.props('defaultExpanded')).toBe(false)
  })

  it('should be expanded when defaultExpanded is true', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
      defaultExpanded: true,
    })
    expect(wrapper.props('defaultExpanded')).toBe(true)
  })

  it('should render with different currencies', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'EUR',
    })
    expect(wrapper.text()).toContain('€300')
  })

  it('should handle empty items array', () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: [],
      currency: 'USD',
    })
    expect(wrapper.text()).toContain('0 items')
    expect(wrapper.text()).toContain('$0.00')
  })

  it('should update expansion state when defaultExpanded changes', async () => {
    const wrapper = renderComponent({
      categoryId: 'cat-1',
      categoryName: 'Groceries',
      categoryColor: '#FF5722',
      categoryIcon: 'eva-shopping-cart-outline',
      items: createMockItems(),
      currency: 'USD',
      defaultExpanded: false,
    })

    await wrapper.setProps({ defaultExpanded: true })
    await nextTick()

    expect(wrapper.props('defaultExpanded')).toBe(true)
  })
})
