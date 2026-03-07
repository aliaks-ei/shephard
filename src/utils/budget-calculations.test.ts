import { describe, expect, it } from 'vitest'
import {
  calculateStillToPay,
  type CategoryExpenseForBudgetCalculation,
} from './budget-calculations'
import type { PlanItem } from 'src/api/plans'

const buildPlanItem = (overrides: Partial<PlanItem>): PlanItem => ({
  id: 'item-1',
  plan_id: 'plan-1',
  category_id: 'cat-1',
  name: 'Item',
  amount: 0,
  is_completed: false,
  is_fixed_payment: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('calculateStillToPay', () => {
  it('uses actualExpenses as fallback when category expense details are not provided', () => {
    const planItems: PlanItem[] = [
      buildPlanItem({ id: 'fixed-1', amount: 100, is_fixed_payment: true, is_completed: false }),
      buildPlanItem({ id: 'var-1', amount: 200, is_fixed_payment: false }),
    ]

    const result = calculateStillToPay('cat-1', planItems, 50)

    expect(result).toBe(250)
  })

  it('subtracts only non-fixed spending when category has mixed fixed and non-fixed items', () => {
    const planItems: PlanItem[] = [
      buildPlanItem({ id: 'fixed-open', amount: 100, is_fixed_payment: true, is_completed: false }),
      buildPlanItem({ id: 'fixed-done', amount: 50, is_fixed_payment: true, is_completed: true }),
      buildPlanItem({ id: 'var-1', amount: 300, is_fixed_payment: false }),
    ]

    const categoryExpenses: CategoryExpenseForBudgetCalculation[] = [
      { amount: 40, plan_item_id: 'fixed-done' },
      { amount: 50, plan_item_id: 'var-1' },
      { amount: 60, plan_item_id: null },
    ]

    const result = calculateStillToPay('cat-1', planItems, 150, categoryExpenses)

    expect(result).toBe(290)
  })

  it('caps non-fixed remainder at zero', () => {
    const planItems: PlanItem[] = [
      buildPlanItem({ id: 'fixed-open', amount: 80, is_fixed_payment: true, is_completed: false }),
      buildPlanItem({ id: 'var-1', amount: 100, is_fixed_payment: false }),
    ]

    const categoryExpenses: CategoryExpenseForBudgetCalculation[] = [
      { amount: 130, plan_item_id: null },
    ]

    const result = calculateStillToPay('cat-1', planItems, 130, categoryExpenses)

    expect(result).toBe(80)
  })
})
