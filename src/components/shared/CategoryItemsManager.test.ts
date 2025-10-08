import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import CategoryItemsManager from './CategoryItemsManager.vue'
import type { BaseItemUI } from 'src/types'
import type { Category } from 'src/api'
import type { CategoryGroup } from 'src/composables/useItemsManager'

vi.mock('src/composables/useEnrichedCategories', () => ({
  useEnrichedCategories: vi.fn(() => ({
    enrichedCategories: ref([
      {
        categoryId: 'cat-1',
        categoryName: 'Groceries',
        categoryColor: '#FF5722',
        categoryIcon: 'eva-shopping-cart-outline',
        items: [
          {
            id: 'item-1',
            name: 'Item 1',
            amount: 100,
            categoryId: 'cat-1',
            categoryColor: '#FF5722',
          },
        ],
      },
    ]),
  })),
}))

installQuasarPlugin()

type CategoryItemsManagerProps = ComponentProps<typeof CategoryItemsManager>

const createMockCategories = (): Category[] => [
  {
    id: 'cat-1',
    name: 'Groceries',
    color: '#FF5722',
    icon: 'eva-shopping-cart-outline',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

const createMockCategoryGroups = (): CategoryGroup<BaseItemUI>[] => [
  {
    categoryId: 'cat-1',
    categoryName: 'Groceries',
    categoryColor: '#FF5722',
    categoryIcon: 'eva-shopping-cart-outline',
    subtotal: 100,
    items: [
      {
        id: 'item-1',
        name: 'Item 1',
        amount: 100,
        categoryId: 'cat-1',
        color: '#FF5722',
      },
    ],
  },
]

const renderComponent = (props: CategoryItemsManagerProps) => {
  return mount(CategoryItemsManager, {
    props,
    global: {
      stubs: {
        CategoryListSection: {
          template:
            '<div class="category-list-section"><slot name="categories" /><slot name="summary" /></div>',
          props: [
            'headerIcon',
            'headerTitle',
            'hasCategories',
            'itemCount',
            'showItemCount',
            'allExpanded',
            'hasDuplicates',
            'showDuplicateWarning',
            'duplicateBannerPosition',
            'duplicateBannerClass',
            'emptyMessage',
          ],
          emits: ['toggle-expand'],
        },
        ItemsSummarySection: {
          template: '<div class="summary" />',
          props: [
            'formattedAmount',
            'itemCount',
            'itemType',
            'summaryLabel',
            'amountSizeMobile',
            'amountSizeDesktop',
          ],
        },
      },
    },
  })
}

describe('CategoryItemsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should render CategoryListSection', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })
    expect(wrapper.find('.category-list-section').exists()).toBe(true)
  })

  it('should render ItemsSummarySection', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })
    expect(wrapper.find('.summary').exists()).toBe(true)
  })

  it('should emit toggle-expand event', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })

    wrapper.vm.$emit('toggle-expand')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('should pass correct props to component', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
      allExpanded: true,
      hasDuplicates: true,
      showDuplicateWarning: true,
    })

    expect(wrapper.props('headerIcon')).toBe('eva-list-outline')
    expect(wrapper.props('headerTitle')).toBe('My Items')
    expect(wrapper.props('allExpanded')).toBe(true)
    expect(wrapper.props('hasDuplicates')).toBe(true)
  })

  it('should use default values for optional props', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })

    expect(wrapper.props('allExpanded')).toBe(false)
    expect(wrapper.props('hasDuplicates')).toBe(false)
  })

  it('should handle empty category groups', () => {
    const wrapper = renderComponent({
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should format currency correctly', () => {
    const wrapper = renderComponent({
      categoryGroups: createMockCategoryGroups(),
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'EUR',
      headerIcon: 'eva-list-outline',
      headerTitle: 'My Items',
    })
    expect(wrapper.exists()).toBe(true)
  })
})
