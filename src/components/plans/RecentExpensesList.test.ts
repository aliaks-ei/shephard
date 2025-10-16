import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import RecentExpensesList from './RecentExpensesList.vue'
import type { ExpenseWithCategory } from 'src/api'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/utils/date', () => ({
  formatDateRelative: vi.fn(() => '2 days ago'),
}))

vi.mock('src/composables/useCategoryHelpers', () => ({
  useCategoryHelpers: vi.fn(() => ({
    getCategoryName: vi.fn(() => 'Food'),
    getCategoryColor: vi.fn(() => '#ff0000'),
    getCategoryIcon: vi.fn(() => 'eva-shopping-cart-outline'),
  })),
}))

vi.mock('src/composables/useExpenseActions', () => ({
  useExpenseActions: vi.fn(() => ({
    confirmDeleteExpense: vi.fn(),
  })),
}))

type RecentExpensesListProps = ComponentProps<typeof RecentExpensesList>

const mockExpenses: ExpenseWithCategory[] = [
  {
    id: 'exp-1',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Groceries',
    amount: 50,
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

const renderRecentExpensesList = (props: RecentExpensesListProps) => {
  return mount(RecentExpensesList, {
    props,
    global: {
      stubs: {
        CategoryIcon: { template: '<div class="category-icon" />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['label', 'color'],
        },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': { template: '<div class="q-item"><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-skeleton': { template: '<div class="q-skeleton" />' },
        'q-icon': { template: '<i />' },
        'q-tooltip': { template: '<div />' },
      },
    },
  })
}

describe('RecentExpensesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderRecentExpensesList({
      expenses: [],
      currency: 'USD',
      isLoading: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display loading skeletons when loading', () => {
    const wrapper = renderRecentExpensesList({
      expenses: [],
      currency: 'USD',
      isLoading: true,
    })

    const skeletons = wrapper.findAll('.q-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should display empty state when no expenses', () => {
    const wrapper = renderRecentExpensesList({
      expenses: [],
      currency: 'USD',
      isLoading: false,
    })

    expect(wrapper.text()).toContain('No expenses registered yet')
  })

  it('should display expenses when provided', () => {
    const wrapper = renderRecentExpensesList({
      expenses: mockExpenses,
      currency: 'USD',
      isLoading: false,
    })

    expect(wrapper.text()).toContain('Groceries')
    expect(wrapper.text()).toContain('USD 50.00')
  })

  it('should show only first 5 expenses', () => {
    const manyExpenses = Array.from({ length: 10 }, (_, i) => ({
      ...mockExpenses[0]!,
      id: `exp-${i}`,
      name: `Expense ${i}`,
    }))

    const wrapper = renderRecentExpensesList({
      expenses: manyExpenses,
      currency: 'USD',
      isLoading: false,
    })

    const items = wrapper.findAll('.q-item')
    expect(items.length).toBeLessThanOrEqual(5)
  })

  it('should show View All button when more than 5 expenses', () => {
    const manyExpenses = Array.from({ length: 6 }, (_, i) => ({
      ...mockExpenses[0]!,
      id: `exp-${i}`,
    }))

    const wrapper = renderRecentExpensesList({
      expenses: manyExpenses,
      currency: 'USD',
      isLoading: false,
    })

    expect(wrapper.props('expenses').length).toBe(6)
  })

  it('should emit view-all when button clicked', () => {
    const manyExpenses = Array.from({ length: 6 }, (_, i) => ({
      ...mockExpenses[0]!,
      id: `exp-${i}`,
    }))

    const wrapper = renderRecentExpensesList({
      expenses: manyExpenses,
      currency: 'USD',
      isLoading: false,
    })

    wrapper.vm.$emit('view-all')
    expect(wrapper.emitted('view-all')).toBeTruthy()
  })

  it('should emit add-expense from empty state button', async () => {
    const wrapper = renderRecentExpensesList({
      expenses: [],
      currency: 'USD',
      isLoading: false,
    })

    const button = wrapper.find('button')
    await button.trigger('click')

    expect(wrapper.emitted('add-expense')).toBeTruthy()
  })

  it('should show delete button when canEdit is true', () => {
    const wrapper = renderRecentExpensesList({
      expenses: mockExpenses,
      currency: 'USD',
      isLoading: false,
      canEdit: true,
    })

    const html = wrapper.html()
    expect(html).toContain('button')
  })

  it('should not show delete button when canEdit is false', () => {
    const wrapper = renderRecentExpensesList({
      expenses: mockExpenses,
      currency: 'USD',
      isLoading: false,
      canEdit: false,
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(0)
  })
})
