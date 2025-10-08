import type { Expense, ExpenseWithCategory, PlanExpenseSummary } from 'src/api/expenses'
import type { Category } from 'src/api/categories'

const createMockCategoryForExpense = (overrides: Partial<Category> = {}): Category => ({
  id: 'cat-1',
  name: 'Groceries',
  icon: 'shopping-cart',
  color: '#FF5733',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1',
  user_id: 'user-1',
  plan_id: 'plan-1',
  plan_item_id: null,
  category_id: 'cat-1',
  amount: 25.5,
  name: 'Weekly groceries',
  expense_date: '2024-01-15',
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  ...overrides,
})

export const createMockExpenseWithCategory = (
  overrides: Partial<ExpenseWithCategory> = {},
): ExpenseWithCategory => ({
  ...createMockExpense(overrides),
  categories: createMockCategoryForExpense(),
  ...overrides,
})

export const createMockExpenses = (count: number = 3): ExpenseWithCategory[] => {
  const expenseData = [
    {
      id: 'expense-1',
      amount: 25.5,
      name: 'Weekly groceries',
      expense_date: '2024-01-15',
      category_id: 'cat-1',
    },
    {
      id: 'expense-2',
      amount: 50.0,
      name: 'Gas station',
      expense_date: '2024-01-14',
      category_id: 'cat-2',
    },
    {
      id: 'expense-3',
      amount: 15.75,
      name: 'Coffee shop',
      expense_date: '2024-01-13',
      category_id: 'cat-3',
    },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockExpenseWithCategory({
      ...(expenseData[i] || {
        id: `expense-${i + 1}`,
        amount: 10.0 * (i + 1),
        name: `Expense ${i + 1}`,
        expense_date: `2024-01-${15 - i}`,
        category_id: `cat-${(i % 3) + 1}`,
      }),
    }),
  )
}

export const createMockExpenseSummary = (
  overrides: Partial<PlanExpenseSummary> = {},
): PlanExpenseSummary => ({
  category_id: 'cat-1',
  planned_amount: 100,
  actual_amount: 75.5,
  remaining_amount: 24.5,
  expense_count: 3,
  ...overrides,
})

export const createMockExpenseSummaries = (count: number = 2): PlanExpenseSummary[] => {
  const summaryData = [
    {
      category_id: 'cat-1',
      planned_amount: 100,
      actual_amount: 75.5,
      remaining_amount: 24.5,
      expense_count: 3,
    },
    {
      category_id: 'cat-2',
      planned_amount: 50,
      actual_amount: 50,
      remaining_amount: 0,
      expense_count: 1,
    },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockExpenseSummary({
      ...(summaryData[i] || {
        category_id: `cat-${i + 1}`,
        planned_amount: 100,
        actual_amount: 50,
        remaining_amount: 50,
        expense_count: 1,
      }),
    }),
  )
}
