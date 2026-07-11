import { it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import ExpenseListItem from './ExpenseListItem.vue'
import { createMockExpenseWithCategory } from 'test/fixtures/expenses'
import type { CurrencyCode } from 'src/utils/currency'

installQuasarPlugin()

const deleteExpenseMock = vi.fn()
const confirmDeleteExpenseMock = vi.fn()

vi.mock('src/composables/useExpenseActions', () => ({
  useExpenseActions: vi.fn(() => ({
    deleteExpense: deleteExpenseMock,
    confirmDeleteExpense: confirmDeleteExpenseMock,
  })),
}))

vi.mock('src/queries/expenses', () => ({
  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const mockExpense = createMockExpenseWithCategory({
  id: 'expense-1',
  name: 'Weekly groceries',
  amount: 25.5,
  expense_date: '2024-01-15',
  original_amount: null,
  original_currency: null,
})

const defaultProps = {
  expense: mockExpense,
  currency: 'USD' as CurrencyCode,
  canEdit: true,
}

it('should mount component properly', () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  expect(wrapper.exists()).toBe(true)
})

it('should display expense name', () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  expect(wrapper.text()).toContain('Weekly groceries')
})

it('should display formatted amount', () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  expect(wrapper.text()).toContain('$25.50')
})

it('should display expense date', () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  expect(wrapper.text()).toContain('Jan 15, 2024')
})

it('should not show category icon when showCategory is false', () => {
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      showCategory: false,
    },
  })

  const categoryIcon = wrapper.findComponent({ name: 'CategoryIcon' })
  expect(categoryIcon.exists()).toBe(false)
})

it('should show category icon when showCategory is true', () => {
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      showCategory: true,
      categoryColor: '#FF5733',
      categoryIcon: 'eva-shopping-cart-outline',
    },
  })

  const categoryIcon = wrapper.findComponent({ name: 'CategoryIcon' })
  expect(categoryIcon.exists()).toBe(true)
})

it('should display category name when provided', () => {
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      categoryName: 'Groceries',
    },
  })

  expect(wrapper.text()).toContain('Groceries')
})

it('should display original amount when currency differs', () => {
  const expenseWithConversion = createMockExpenseWithCategory({
    amount: 23.0,
    original_amount: 25.5,
    original_currency: 'EUR',
  })

  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      expense: expenseWithConversion,
    },
  })

  expect(wrapper.text()).toContain('€25,50')
})

it('should show delete button on desktop when canEdit is true', () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  const deleteBtn = wrapper
    .findAllComponents({ name: 'QBtn' })
    .find((btn) => btn.props('icon') === 'eva-trash-2-outline')
  expect(deleteBtn?.exists()).toBe(true)
})

it('should not show delete button when canEdit is false', () => {
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      canEdit: false,
    },
  })

  const deleteBtn = wrapper
    .findAllComponents({ name: 'QBtn' })
    .find((btn) => btn.props('icon') === 'eva-trash-2-outline')
  expect(deleteBtn).toBeUndefined()
})

it('should call confirmDeleteExpense when desktop delete button is clicked', async () => {
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
  })

  const deleteBtn = wrapper
    .findAllComponents({ name: 'QBtn' })
    .find((btn) => btn.props('icon') === 'eva-trash-2-outline')
  await deleteBtn?.trigger('click')

  expect(confirmDeleteExpenseMock).toHaveBeenCalledWith(mockExpense, expect.any(Function))
  expect(deleteBtn?.attributes('aria-label')).toBe('Delete expense')
})

it('should make the expense row navigate when a source route is provided', () => {
  const to = { name: 'plan', params: { id: 'plan-1' } }
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      to,
    },
  })

  const item = wrapper.findComponent({ name: 'QItem' })
  expect(item.props('clickable')).toBe(true)
  expect(item.props('to')).toEqual(to)
})

it('should call confirmDeleteExpense when mobile swipe delete is triggered', async () => {
  const reset = vi.fn()
  const wrapper = mount(ExpenseListItem, {
    props: defaultProps,
    global: {
      mocks: {
        $q: {
          screen: {
            lt: { md: true },
          },
        },
      },
      stubs: {
        QSlideItem: {
          template:
            '<div class="q-slide-item"><button class="swipe-delete" @click="$emit(\'right\', { reset })" /><slot /></div>',
          setup() {
            return { reset }
          },
        },
      },
    },
  })

  await wrapper.find('.swipe-delete').trigger('click')

  expect(reset).toHaveBeenCalledOnce()
  expect(confirmDeleteExpenseMock).toHaveBeenCalledWith(mockExpense, expect.any(Function))
  expect(deleteExpenseMock).not.toHaveBeenCalled()
})

it('should apply itemClass prop', () => {
  const wrapper = mount(ExpenseListItem, {
    props: {
      ...defaultProps,
      itemClass: 'q-px-md',
    },
  })

  const qItem = wrapper.findComponent({ name: 'QItem' })
  expect(qItem.classes()).toContain('q-px-md')
})
