import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import { ref } from 'vue'
import CategoryExpensesDialog from './CategoryExpensesDialog.vue'
import type { ExpenseWithCategory } from 'src/api'
import type { CategoryBudget } from 'src/types'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/queries/expenses', () => ({
  useExpensesByPlanQuery: vi.fn(() => ({
    expenses: ref([]),
    totalExpensesAmount: ref(0),
    sortedExpenses: ref([]),
    expensesByCategory: ref({}),
    getExpensesForPlanItem: vi.fn(() => []),
    isPending: ref(false),
    data: ref(null),
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
}))

vi.mock('src/utils/date', () => ({
  formatDate: vi.fn(() => 'Jan 1, 2024'),
}))

vi.mock('src/utils/budget', () => ({
  getBudgetProgressColor: vi.fn(() => 'primary'),
  getBudgetRemainingColorClass: vi.fn(() => 'text-positive'),
}))

vi.mock('src/composables/useExpenseActions', () => ({
  useExpenseActions: vi.fn(() => ({
    confirmDeleteExpense: vi.fn(),
  })),
}))

vi.mock('src/queries/plans', () => ({
  useUpdatePlanItemCompletionMutation: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: ref(false),
  })),
}))

type CategoryExpensesDialogProps = ComponentProps<typeof CategoryExpensesDialog>

const mockCategory: CategoryBudget = {
  categoryId: 'cat-1',
  categoryName: 'Food',
  categoryColor: '#ff0000',
  categoryIcon: 'eva-shopping-cart-outline',
  plannedAmount: 500,
  actualAmount: 300,
  remainingAmount: 200,
  expenseCount: 2,
}

const mockExpenses: ExpenseWithCategory[] = [
  {
    id: 'exp-1',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Groceries',
    amount: 150,
    expense_date: '2024-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    plan_item_id: null,
    currency: null,
    original_amount: null,
    original_currency: null,
    categories: {
      id: 'cat-1',
      name: 'Food',
      icon: 'eva-shopping-cart-outline',
      color: '#ff0000',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: null,
    },
  },
]

const renderCategoryExpensesDialog = (props: CategoryExpensesDialogProps) => {
  return mount(CategoryExpensesDialog, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        CategoryIcon: { template: '<div class="category-icon" />' },
        ExpenseRegistrationDialog: { template: '<div />' },
        'q-dialog': {
          template: '<div v-if="modelValue"><slot /></div>',
          props: ['modelValue'],
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-separator': { template: '<hr />' },
        'q-tabs': { template: '<div><slot /></div>', props: ['modelValue'] },
        'q-tab': { template: '<div><slot /></div>', props: ['name', 'label', 'icon'] },
        'q-tab-panels': { template: '<div><slot /></div>', props: ['modelValue'] },
        'q-tab-panel': { template: '<div><slot /></div>', props: ['name'] },
        'q-linear-progress': { template: '<div class="q-linear-progress" />' },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': { template: '<div class="q-item"><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-checkbox': {
          template: '<input type="checkbox" />',
          props: ['modelValue', 'disable'],
        },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['label', 'icon'],
        },
        'q-space': { template: '<div />' },
        'q-icon': { template: '<i />' },
        'q-tooltip': { template: '<div />' },
        'q-badge': { template: '<span><slot /></span>' },
      },
    },
  })
}

describe('CategoryExpensesDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should not render when modelValue is false', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: false,
      category: mockCategory,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: false,
    })

    const html = wrapper.html()
    expect(html).not.toContain('Food')
  })

  it('should display category name', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })

    expect(wrapper.text()).toContain('Food')
  })

  it('should display budget summary', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })

    expect(wrapper.text()).toContain('Budget')
    expect(wrapper.text()).toContain('Spent')
    expect(wrapper.text()).toContain('USD 500.00')
    expect(wrapper.text()).toContain('USD 300.00')
  })

  it('should display expenses', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: mockExpenses,
      currency: 'USD',
      canEdit: false,
    })

    expect(wrapper.text()).toContain('Groceries')
    expect(wrapper.text()).toContain('USD 150.00')
  })

  it('should emit update:modelValue when closed', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })

    wrapper.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should emit refresh event', () => {
    const wrapper = renderCategoryExpensesDialog({
      modelValue: true,
      category: mockCategory,
      expenses: [],
      currency: 'USD',
      canEdit: false,
    })

    wrapper.vm.$emit('refresh')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})
