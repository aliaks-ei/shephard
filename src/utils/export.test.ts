import { describe, expect, it } from 'vitest'
import type { Category, ExpenseWithCategory, PlanWithItems, TemplateWithItems } from 'src/api'
import type { CategoryBudget } from 'src/types'
import {
  createPlanExportDownload,
  createPlanExportPayload,
  createTemplateExportDownload,
  createTemplateExportPayload,
} from './export'

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food & Dining',
    color: '#FF5722',
    icon: 'eva-pricetags-outline',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const template: TemplateWithItems = {
  id: 'template-1',
  name: 'Monthly Budget',
  duration: 'monthly',
  currency: 'USD',
  total: 1500,
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  template_items: [
    {
      id: 'item-1',
      template_id: 'template-1',
      name: 'Groceries, Home',
      category_id: 'cat-1',
      amount: 500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_fixed_payment: true,
    },
  ],
}

const plan: PlanWithItems = {
  id: 'plan-1',
  name: 'Q2 Budget',
  template_id: 'template-1',
  start_date: '2024-06-01',
  end_date: '2024-06-30',
  status: 'active',
  currency: 'USD',
  total: 1500,
  owner_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  plan_items: [
    {
      id: 'plan-item-1',
      plan_id: 'plan-1',
      name: 'Groceries "Weekly"',
      category_id: 'cat-1',
      amount: 500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_completed: false,
      is_fixed_payment: true,
    },
  ],
}

const categoryBudgets: CategoryBudget[] = [
  {
    categoryId: 'cat-1',
    categoryName: 'Food & Dining',
    categoryColor: '#FF5722',
    categoryIcon: 'eva-pricetags-outline',
    plannedAmount: 500,
    actualAmount: 120.75,
    remainingAmount: 379.25,
    expenseCount: 2,
  },
]

const expenses: ExpenseWithCategory[] = [
  {
    id: 'expense-1',
    name: 'Market run',
    amount: 45.5,
    currency: 'USD',
    original_amount: null,
    original_currency: null,
    expense_date: '2024-06-03',
    category_id: 'cat-1',
    plan_id: 'plan-1',
    plan_item_id: 'plan-item-1',
    user_id: 'user-1',
    created_at: '2024-06-03T10:00:00Z',
    updated_at: '2024-06-03T10:00:00Z',
    categories: categories[0]!,
  },
]

describe('export utils', () => {
  it('builds template JSON payload with category details', () => {
    const payload = createTemplateExportPayload(template, categories, '2026-04-13T12:00:00.000Z')

    expect(payload.schema_version).toBe('1.0')
    expect(payload.items).toEqual([
      expect.objectContaining({
        id: 'item-1',
        category_name: 'Food & Dining',
        category_color: '#FF5722',
      }),
    ])
  })

  it('builds template CSV download with escaped item names', () => {
    const download = createTemplateExportDownload(
      template,
      categories,
      'csv',
      '2026-04-13T12:00:00.000Z',
    )

    expect(download.filename).toBe('template_monthly-budget_2026-04-13.csv')
    expect(download.content).toContain('"Groceries, Home"')
    expect(download.content.split('\n')[0]).toContain('template_id')
  })

  it('builds plan JSON payload with category summary and expenses', () => {
    const payload = createPlanExportPayload(
      plan,
      categories,
      categoryBudgets,
      expenses,
      '2026-04-13T12:00:00.000Z',
    )

    expect(payload.category_summary).toEqual([
      expect.objectContaining({
        category_id: 'cat-1',
        actual_amount: 120.75,
        expense_count: 2,
      }),
    ])
    expect(payload.expenses).toEqual([
      expect.objectContaining({
        id: 'expense-1',
        category_name: 'Food & Dining',
      }),
    ])
  })

  it('builds plan CSV download with aggregate category columns', () => {
    const download = createPlanExportDownload(
      plan,
      categories,
      categoryBudgets,
      expenses,
      'csv',
      '2026-04-13T12:00:00.000Z',
    )

    expect(download.filename).toBe('plan_q2-budget_2026-04-13.csv')
    expect(download.content.split('\n')[0]).toContain('category_actual_amount')
    expect(download.content).toContain('"Groceries ""Weekly"""')
    expect(download.content).toContain('120.75')
    expect(download.content).toContain('379.25')
  })
})
