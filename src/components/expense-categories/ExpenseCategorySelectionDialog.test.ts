import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ExpenseCategorySelectionDialog from './ExpenseCategorySelectionDialog.vue'
import type { ExpenseCategory } from 'src/api'

installQuasarPlugin()

type ExpenseCategorySelectionDialogProps = ComponentProps<typeof ExpenseCategorySelectionDialog>

const mockCategories: ExpenseCategory[] = [
  {
    id: 'category-1',
    name: 'Rent/Mortgage',
    color: '#1d4ed8',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'category-2',
    name: 'Transportation',
    color: '#6366f1',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 'category-3',
    name: 'Entertainment',
    color: '#e879f9',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
  },
]

const defaultProps: ExpenseCategorySelectionDialogProps = {
  modelValue: true,
  usedCategoryIds: [],
  categories: mockCategories,
}

const renderExpenseCategorySelectionDialog = (
  props: Partial<ExpenseCategorySelectionDialogProps> = {},
) => {
  return mount(ExpenseCategorySelectionDialog, {
    props: { ...defaultProps, ...props },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
    },
  })
}

describe('ExpenseCategorySelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderExpenseCategorySelectionDialog()
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props', () => {
    const wrapper = renderExpenseCategorySelectionDialog({
      modelValue: false,
      usedCategoryIds: ['category-1'],
      categories: mockCategories,
    })

    expect(wrapper.props()).toEqual({
      modelValue: false,
      usedCategoryIds: ['category-1'],
      categories: mockCategories,
    })
  })

  describe('Component Behavior', () => {
    it('should render with different prop combinations', () => {
      const wrapper1 = renderExpenseCategorySelectionDialog({
        usedCategoryIds: ['category-2'],
      })
      const wrapper2 = renderExpenseCategorySelectionDialog({
        usedCategoryIds: ['category-1', 'category-2', 'category-3'],
      })
      const wrapper3 = renderExpenseCategorySelectionDialog({
        usedCategoryIds: [],
      })

      expect(wrapper1.exists()).toBe(true)
      expect(wrapper2.exists()).toBe(true)
      expect(wrapper3.exists()).toBe(true)
    })

    it('should handle edge case props without errors', () => {
      const wrapper1 = renderExpenseCategorySelectionDialog({
        categories: [],
        usedCategoryIds: [],
      })

      const categoriesWithNulls: ExpenseCategory[] = [
        {
          id: 'category-null',
          name: 'Test Category',
          color: '#000000',
          icon: 'eva-pricetags-outline',
          created_at: null,
          updated_at: null,
        },
      ]

      const wrapper2 = renderExpenseCategorySelectionDialog({
        categories: categoriesWithNulls,
        usedCategoryIds: [],
      })

      const wrapper3 = renderExpenseCategorySelectionDialog({
        usedCategoryIds: ['non-existent-id', 'category-1'],
      })

      expect(wrapper1.exists()).toBe(true)
      expect(wrapper2.exists()).toBe(true)
      expect(wrapper3.exists()).toBe(true)
    })
  })

  describe('Props Validation', () => {
    it('should accept modelValue as boolean', () => {
      const wrapper1 = renderExpenseCategorySelectionDialog({ modelValue: true })
      const wrapper2 = renderExpenseCategorySelectionDialog({ modelValue: false })

      expect(wrapper1.props('modelValue')).toBe(true)
      expect(wrapper2.props('modelValue')).toBe(false)
    })

    it('should accept usedCategoryIds as string array', () => {
      const usedIds = ['id1', 'id2', 'id3']
      const wrapper = renderExpenseCategorySelectionDialog({ usedCategoryIds: usedIds })

      expect(wrapper.props('usedCategoryIds')).toEqual(usedIds)
    })

    it('should accept categories as ExpenseCategory array', () => {
      const wrapper = renderExpenseCategorySelectionDialog({ categories: mockCategories })

      expect(wrapper.props('categories')).toEqual(mockCategories)
    })
  })

  describe('Reactivity', () => {
    it('should handle prop changes without errors', async () => {
      const wrapper = renderExpenseCategorySelectionDialog({
        usedCategoryIds: [],
      })

      expect(wrapper.exists()).toBe(true)

      await wrapper.setProps({ usedCategoryIds: ['category-1'] })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('usedCategoryIds')).toEqual(['category-1'])
    })

    it('should handle categories array changes without errors', async () => {
      const wrapper = renderExpenseCategorySelectionDialog({
        categories: [mockCategories[0]!],
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('categories')).toEqual([mockCategories[0]])

      await wrapper.setProps({ categories: mockCategories })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.props('categories')).toEqual(mockCategories)
    })
  })
})
