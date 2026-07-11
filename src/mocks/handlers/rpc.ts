import { http, HttpResponse } from 'msw'
import type {
  ExpenseSort,
  ExpenseWithCategoryAndPlan,
  PlanExpenseSummary,
  PlanOverviewSnapshotRow,
} from 'src/api/expenses'
import type { PlanSharedUser } from 'src/api/plans'
import type { TemplateSharedUser } from 'src/api/templates'
import { getAll, getById } from 'src/mocks/data/db'
import { getPlanItemsWithTrackingData, users as seedUsers } from 'src/mocks/data/seed'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function getPlanExpenseSummary(planId: string): PlanExpenseSummary[] {
  const items = getAll('plan_items').filter((item) => item.plan_id === planId)
  const expenses = getAll('expenses').filter((expense) => expense.plan_id === planId)
  const itemsById = new Map(items.map((item) => [item.id, item]))
  const categoryIds = new Set([
    ...items.map((item) => item.category_id),
    ...expenses.map((expense) => expense.category_id),
  ])

  return Array.from(categoryIds).map((categoryId) => {
    const categoryItems = items.filter((item) => item.category_id === categoryId)
    const categoryExpenses = expenses.filter((expense) => expense.category_id === categoryId)
    const plannedAmount = categoryItems.reduce((sum, item) => sum + item.amount, 0)
    const actualAmount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const uncompletedFixedAmount = categoryItems
      .filter((item) => item.is_fixed_payment && !item.is_completed)
      .reduce((sum, item) => sum + item.amount, 0)
    const nonFixedPlannedAmount = categoryItems
      .filter((item) => !item.is_fixed_payment)
      .reduce((sum, item) => sum + item.amount, 0)
    const nonFixedExpenseAmount = categoryExpenses
      .filter((expense) => {
        if (!expense.plan_item_id) return true
        return itemsById.get(expense.plan_item_id)?.is_fixed_payment === false
      })
      .reduce((sum, expense) => sum + expense.amount, 0)

    return {
      category_id: categoryId,
      planned_amount: plannedAmount,
      actual_amount: actualAmount,
      remaining_amount:
        uncompletedFixedAmount + Math.max(0, nonFixedPlannedAmount - nonFixedExpenseAmount),
      expense_count: categoryExpenses.length,
    }
  })
}

function getPlanOverviewSnapshots(planIds: string[]): PlanOverviewSnapshotRow[] {
  return planIds.flatMap((planId) =>
    getPlanExpenseSummary(planId).flatMap((summary) => {
      const category = getById('categories', summary.category_id)
      if (!category) return []

      return [
        {
          ...summary,
          plan_id: planId,
          category_name: category.name,
          category_color: category.color,
          category_icon: category.icon,
        },
      ]
    }),
  )
}

function resolveExpenseSort(value: string | undefined): ExpenseSort {
  switch (value) {
    case 'date-asc':
    case 'amount-desc':
    case 'amount-asc':
      return value
    case 'date-desc':
    case undefined:
      return 'date-desc'
    default:
      return 'date-desc'
  }
}

function compareRecentExpenses(
  a: ExpenseWithCategoryAndPlan,
  b: ExpenseWithCategoryAndPlan,
  sortBy: ExpenseSort,
): number {
  const newestFirst =
    b.expense_date.localeCompare(a.expense_date) ||
    b.created_at.localeCompare(a.created_at) ||
    b.id.localeCompare(a.id)

  switch (sortBy) {
    case 'date-desc':
      return newestFirst
    case 'date-asc':
      return (
        a.expense_date.localeCompare(b.expense_date) ||
        a.created_at.localeCompare(b.created_at) ||
        a.id.localeCompare(b.id)
      )
    case 'amount-desc':
      return b.amount - a.amount || newestFirst
    case 'amount-asc':
      return a.amount - b.amount || newestFirst
    default: {
      const exhaustiveSort: never = sortBy
      return exhaustiveSort
    }
  }
}

function getRecentExpensesPage(body: {
  p_user_id: string
  p_limit?: number
  p_offset?: number
  p_search?: string | null
  p_category_id?: string | null
  p_sort_by?: string
}): ExpenseWithCategoryAndPlan[] {
  const search = body.p_search?.trim().toLowerCase() ?? ''
  const sortBy = resolveExpenseSort(body.p_sort_by)
  const limit = Math.max(1, Math.min(Math.trunc(body.p_limit ?? 40), 100))
  const offset = Math.max(0, Math.trunc(body.p_offset ?? 0))

  return getAll('expenses')
    .filter(
      (expense) =>
        expense.user_id === body.p_user_id &&
        (!body.p_category_id || expense.category_id === body.p_category_id),
    )
    .flatMap((expense) => {
      const category = getById('categories', expense.category_id)
      const plan = getById('plans', expense.plan_id)
      if (!category || !plan) return []

      const result: ExpenseWithCategoryAndPlan = {
        ...expense,
        categories: category,
        plans: {
          id: plan.id,
          name: plan.name,
          currency: plan.currency,
        },
      }

      if (
        search &&
        !expense.name.toLowerCase().includes(search) &&
        !category.name.toLowerCase().includes(search) &&
        !plan.name.toLowerCase().includes(search)
      ) {
        return []
      }

      return [result]
    })
    .sort((a, b) => compareRecentExpenses(a, b, sortBy))
    .slice(offset, offset + limit)
}

function getTemplateSharedUsers(templateId: string): TemplateSharedUser[] {
  return getAll('template_shares')
    .filter((share) => share.template_id === templateId)
    .map((share) => {
      const user = getById('users', share.shared_with_user_id)

      return {
        user_id: share.shared_with_user_id,
        user_name: user?.name ?? 'Unknown user',
        user_email: user?.email ?? 'unknown@example.com',
        permission_level: share.permission_level,
        shared_at: share.created_at,
      }
    })
}

function getPlanSharedUsers(planId: string): PlanSharedUser[] {
  return getAll('plan_shares')
    .filter((share) => share.plan_id === planId)
    .map((share) => {
      const user = getById('users', share.shared_with_user_id)

      return {
        user_id: share.shared_with_user_id,
        user_name: user?.name ?? 'Unknown user',
        user_email: user?.email ?? 'unknown@example.com',
        permission_level: share.permission_level,
        shared_at: share.created_at,
      }
    })
}

export const rpcHandlers = [
  // get_plan_expense_summary
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_expense_summary`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanExpenseSummary(body.p_plan_id))
  }),

  // get_plan_overview_snapshots
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_overview_snapshots`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_ids: string[] }
    return HttpResponse.json(getPlanOverviewSnapshots(body.p_plan_ids))
  }),

  // get_recent_expenses_page
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_recent_expenses_page`, async ({ request }) => {
    const body = (await request.json()) as Parameters<typeof getRecentExpensesPage>[0]
    return HttpResponse.json(getRecentExpensesPage(body))
  }),

  // get_plan_items_with_tracking
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_items_with_tracking`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanItemsWithTrackingData(body.p_plan_id))
  }),

  // get_plan_items_with_tracking_by_category
  http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_plan_items_with_tracking_by_category`,
    async ({ request }) => {
      const body = (await request.json()) as { p_plan_id: string; p_category_id: string }
      return HttpResponse.json(getPlanItemsWithTrackingData(body.p_plan_id, body.p_category_id))
    },
  ),

  // get_template_shared_users
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_template_shared_users`, async ({ request }) => {
    const body = (await request.json()) as { p_template_id: string }
    return HttpResponse.json(getTemplateSharedUsers(body.p_template_id))
  }),

  // get_plan_shared_users
  http.post(`${SUPABASE_URL}/rest/v1/rpc/get_plan_shared_users`, async ({ request }) => {
    const body = (await request.json()) as { p_plan_id: string }
    return HttpResponse.json(getPlanSharedUsers(body.p_plan_id))
  }),

  // search_users_for_sharing
  http.post(`${SUPABASE_URL}/rest/v1/rpc/search_users_for_sharing`, async ({ request }) => {
    const body = (await request.json()) as { q: string; entity_id?: string; entity_type?: string }
    const query = body.q.toLowerCase()
    const sharedUserIds =
      body.entity_type === 'plan'
        ? new Set(
            getAll('plan_shares')
              .filter((share) => share.plan_id === body.entity_id)
              .map((share) => share.shared_with_user_id),
          )
        : new Set(
            getAll('template_shares')
              .filter((share) => share.template_id === body.entity_id)
              .map((share) => share.shared_with_user_id),
          )
    const results = seedUsers
      .filter(
        (u) =>
          !sharedUserIds.has(u.id) &&
          (u.email.toLowerCase().includes(query) || u.name.toLowerCase().includes(query)),
      )
      .map((u) => ({ id: u.id, name: u.name, email: u.email }))
    return HttpResponse.json(results)
  }),
]
