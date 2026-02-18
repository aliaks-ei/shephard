import type { Tables } from 'src/lib/supabase/types'
import type { PlanExpenseSummary } from 'src/api/expenses'
import type { TemplateSharedUser } from 'src/api/templates'
import type { PlanSharedUser } from 'src/api/plans'

// ── IDs ──

export const MOCK_USER_ID = '00000000-0000-4000-a000-000000000001'
export const MOCK_SHARED_USER_ID = '00000000-0000-4000-a000-000000000002'
export const MOCK_VIEWER_USER_ID = '00000000-0000-4000-a000-000000000003'

// ── Categories ──

export const categories: Tables<'categories'>[] = [
  {
    id: 'cat-food',
    name: 'Food & Groceries',
    icon: 'eva-shopping-cart-outline',
    color: '#4CAF50',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: 'cat-transport',
    name: 'Transport',
    icon: 'eva-car-outline',
    color: '#2196F3',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: 'cat-entertainment',
    name: 'Entertainment',
    icon: 'eva-film-outline',
    color: '#9C27B0',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: 'cat-shopping',
    name: 'Shopping',
    icon: 'eva-pricetags-outline',
    color: '#FF9800',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: 'cat-bills',
    name: 'Bills & Utilities',
    icon: 'eva-flash-outline',
    color: '#F44336',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
]

// ── Users ──

export const users: Tables<'users'>[] = [
  {
    id: MOCK_USER_ID,
    name: 'Demo User',
    email: 'demo@shephard.app',
    avatar: null,
    preferences: {
      theme: 'light',
      currency: 'EUR',
      pushNotificationsEnabled: false,
      isPrivacyModeEnabled: false,
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: null,
  },
  {
    id: MOCK_SHARED_USER_ID,
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: null,
    preferences: null,
    created_at: '2025-01-10T00:00:00Z',
    updated_at: null,
  },
  {
    id: MOCK_VIEWER_USER_ID,
    name: 'Bob Viewer',
    email: 'bob@example.com',
    avatar: null,
    preferences: null,
    created_at: '2025-02-01T00:00:00Z',
    updated_at: null,
  },
]

// ── Auth session ──

export const mockAuthUser = {
  id: MOCK_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@shephard.app',
  email_confirmed_at: '2025-01-01T00:00:00Z',
  phone: '',
  confirmed_at: '2025-01-01T00:00:00Z',
  last_sign_in_at: new Date().toISOString(),
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { name: 'Demo User' },
  identities: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
}

// ── Templates ──

export const templates: Tables<'templates'>[] = [
  {
    id: 'tmpl-monthly',
    name: 'Monthly Budget',
    owner_id: MOCK_USER_ID,
    duration: 'monthly',
    total: 2500,
    currency: 'EUR',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-20T14:30:00Z',
  },
  {
    id: 'tmpl-shared-edit',
    name: 'Household Expenses',
    owner_id: MOCK_SHARED_USER_ID,
    duration: 'monthly',
    total: 1800,
    currency: 'EUR',
    created_at: '2025-01-08T09:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-shared-view',
    name: 'Travel Fund',
    owner_id: MOCK_VIEWER_USER_ID,
    duration: 'weekly',
    total: 500,
    currency: 'USD',
    created_at: '2025-02-01T12:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-weekly',
    name: 'Weekly Essentials',
    owner_id: MOCK_USER_ID,
    duration: 'weekly',
    total: 350,
    currency: 'EUR',
    created_at: '2025-02-10T08:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-savings',
    name: 'Savings Goal',
    owner_id: MOCK_USER_ID,
    duration: 'monthly',
    total: 800,
    currency: 'USD',
    created_at: '2025-01-15T16:00:00Z',
    updated_at: '2025-02-05T11:00:00Z',
  },
]

export const templateItems: Tables<'template_items'>[] = [
  // Monthly Budget items
  {
    id: 'tmpl-item-1',
    template_id: 'tmpl-monthly',
    name: 'Groceries',
    amount: 600,
    category_id: 'cat-food',
    is_fixed_payment: false,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-2',
    template_id: 'tmpl-monthly',
    name: 'Bus Pass',
    amount: 80,
    category_id: 'cat-transport',
    is_fixed_payment: true,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-3',
    template_id: 'tmpl-monthly',
    name: 'Netflix & Spotify',
    amount: 25,
    category_id: 'cat-entertainment',
    is_fixed_payment: true,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-4',
    template_id: 'tmpl-monthly',
    name: 'Electricity',
    amount: 120,
    category_id: 'cat-bills',
    is_fixed_payment: true,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-5',
    template_id: 'tmpl-monthly',
    name: 'Clothing',
    amount: 150,
    category_id: 'cat-shopping',
    is_fixed_payment: false,
    created_at: '2025-01-05T10:00:00Z',
    updated_at: null,
  },
  // Household Expenses items
  {
    id: 'tmpl-item-6',
    template_id: 'tmpl-shared-edit',
    name: 'Shared Groceries',
    amount: 400,
    category_id: 'cat-food',
    is_fixed_payment: false,
    created_at: '2025-01-08T09:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-7',
    template_id: 'tmpl-shared-edit',
    name: 'Internet',
    amount: 50,
    category_id: 'cat-bills',
    is_fixed_payment: true,
    created_at: '2025-01-08T09:00:00Z',
    updated_at: null,
  },
  // Travel Fund items
  {
    id: 'tmpl-item-8',
    template_id: 'tmpl-shared-view',
    name: 'Dining Out',
    amount: 200,
    category_id: 'cat-food',
    is_fixed_payment: false,
    created_at: '2025-02-01T12:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-9',
    template_id: 'tmpl-shared-view',
    name: 'Activities',
    amount: 300,
    category_id: 'cat-entertainment',
    is_fixed_payment: false,
    created_at: '2025-02-01T12:00:00Z',
    updated_at: null,
  },
  // Weekly Essentials items
  {
    id: 'tmpl-item-10',
    template_id: 'tmpl-weekly',
    name: 'Food & Snacks',
    amount: 150,
    category_id: 'cat-food',
    is_fixed_payment: false,
    created_at: '2025-02-10T08:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-11',
    template_id: 'tmpl-weekly',
    name: 'Metro Tickets',
    amount: 20,
    category_id: 'cat-transport',
    is_fixed_payment: false,
    created_at: '2025-02-10T08:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-12',
    template_id: 'tmpl-weekly',
    name: 'Weekend Fun',
    amount: 80,
    category_id: 'cat-entertainment',
    is_fixed_payment: false,
    created_at: '2025-02-10T08:00:00Z',
    updated_at: null,
  },
  // Savings Goal items
  {
    id: 'tmpl-item-13',
    template_id: 'tmpl-savings',
    name: 'Emergency Fund',
    amount: 500,
    category_id: 'cat-bills',
    is_fixed_payment: true,
    created_at: '2025-01-15T16:00:00Z',
    updated_at: null,
  },
  {
    id: 'tmpl-item-14',
    template_id: 'tmpl-savings',
    name: 'Impulse Buffer',
    amount: 300,
    category_id: 'cat-shopping',
    is_fixed_payment: false,
    created_at: '2025-01-15T16:00:00Z',
    updated_at: null,
  },
]

export const templateShares: Tables<'template_shares'>[] = [
  {
    id: 'ts-1',
    template_id: 'tmpl-shared-edit',
    shared_with_user_id: MOCK_USER_ID,
    shared_by_user_id: MOCK_SHARED_USER_ID,
    permission_level: 'edit',
    created_at: '2025-01-09T10:00:00Z',
  },
  {
    id: 'ts-2',
    template_id: 'tmpl-shared-view',
    shared_with_user_id: MOCK_USER_ID,
    shared_by_user_id: MOCK_VIEWER_USER_ID,
    permission_level: 'view',
    created_at: '2025-02-02T10:00:00Z',
  },
]

// ── Plans ──

const today = new Date()
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
const twoMonthsAgoStart = new Date(today.getFullYear(), today.getMonth() - 2, 1)
const twoMonthsAgoEnd = new Date(today.getFullYear(), today.getMonth() - 1, 0)
const thisWeekStart = new Date(today)
thisWeekStart.setDate(today.getDate() - today.getDay() + 1) // Monday
const thisWeekEnd = new Date(thisWeekStart)
thisWeekEnd.setDate(thisWeekStart.getDate() + 6) // Sunday

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0] as string
}

export const plans: Tables<'plans'>[] = [
  {
    id: 'plan-active',
    name: 'February Budget',
    owner_id: MOCK_USER_ID,
    template_id: 'tmpl-monthly',
    start_date: toDateString(startOfMonth),
    end_date: toDateString(endOfMonth),
    status: 'active',
    total: 2500,
    currency: 'EUR',
    created_at: startOfMonth.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'plan-completed',
    name: 'January Budget',
    owner_id: MOCK_USER_ID,
    template_id: 'tmpl-monthly',
    start_date: toDateString(lastMonthStart),
    end_date: toDateString(lastMonthEnd),
    status: 'completed',
    total: 2500,
    currency: 'EUR',
    created_at: lastMonthStart.toISOString(),
    updated_at: lastMonthEnd.toISOString(),
  },
  {
    id: 'plan-weekly',
    name: 'This Week',
    owner_id: MOCK_USER_ID,
    template_id: 'tmpl-weekly',
    start_date: toDateString(thisWeekStart),
    end_date: toDateString(thisWeekEnd),
    status: 'active',
    total: 350,
    currency: 'EUR',
    created_at: thisWeekStart.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'plan-dec',
    name: 'December Budget',
    owner_id: MOCK_USER_ID,
    template_id: 'tmpl-monthly',
    start_date: toDateString(twoMonthsAgoStart),
    end_date: toDateString(twoMonthsAgoEnd),
    status: 'completed',
    total: 2500,
    currency: 'EUR',
    created_at: twoMonthsAgoStart.toISOString(),
    updated_at: twoMonthsAgoEnd.toISOString(),
  },
]

export const planItems: Tables<'plan_items'>[] = [
  // Active plan items
  {
    id: 'pi-1',
    plan_id: 'plan-active',
    name: 'Groceries',
    amount: 600,
    category_id: 'cat-food',
    is_fixed_payment: false,
    is_completed: false,
    created_at: startOfMonth.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-2',
    plan_id: 'plan-active',
    name: 'Bus Pass',
    amount: 80,
    category_id: 'cat-transport',
    is_fixed_payment: true,
    is_completed: true,
    created_at: startOfMonth.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-3',
    plan_id: 'plan-active',
    name: 'Netflix & Spotify',
    amount: 25,
    category_id: 'cat-entertainment',
    is_fixed_payment: true,
    is_completed: true,
    created_at: startOfMonth.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-4',
    plan_id: 'plan-active',
    name: 'Electricity',
    amount: 120,
    category_id: 'cat-bills',
    is_fixed_payment: true,
    is_completed: false,
    created_at: startOfMonth.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-5',
    plan_id: 'plan-active',
    name: 'Clothing',
    amount: 150,
    category_id: 'cat-shopping',
    is_fixed_payment: false,
    is_completed: false,
    created_at: startOfMonth.toISOString(),
    updated_at: null,
  },
  // Completed plan items (January)
  {
    id: 'pi-6',
    plan_id: 'plan-completed',
    name: 'Groceries',
    amount: 600,
    category_id: 'cat-food',
    is_fixed_payment: false,
    is_completed: true,
    created_at: lastMonthStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-7',
    plan_id: 'plan-completed',
    name: 'Bus Pass',
    amount: 80,
    category_id: 'cat-transport',
    is_fixed_payment: true,
    is_completed: true,
    created_at: lastMonthStart.toISOString(),
    updated_at: null,
  },
  // Weekly plan items
  {
    id: 'pi-8',
    plan_id: 'plan-weekly',
    name: 'Food & Snacks',
    amount: 150,
    category_id: 'cat-food',
    is_fixed_payment: false,
    is_completed: false,
    created_at: thisWeekStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-9',
    plan_id: 'plan-weekly',
    name: 'Metro Tickets',
    amount: 20,
    category_id: 'cat-transport',
    is_fixed_payment: false,
    is_completed: false,
    created_at: thisWeekStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-10',
    plan_id: 'plan-weekly',
    name: 'Weekend Fun',
    amount: 80,
    category_id: 'cat-entertainment',
    is_fixed_payment: false,
    is_completed: false,
    created_at: thisWeekStart.toISOString(),
    updated_at: null,
  },
  // December plan items
  {
    id: 'pi-11',
    plan_id: 'plan-dec',
    name: 'Groceries',
    amount: 600,
    category_id: 'cat-food',
    is_fixed_payment: false,
    is_completed: true,
    created_at: twoMonthsAgoStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'pi-12',
    plan_id: 'plan-dec',
    name: 'Holiday Gifts',
    amount: 400,
    category_id: 'cat-shopping',
    is_fixed_payment: false,
    is_completed: true,
    created_at: twoMonthsAgoStart.toISOString(),
    updated_at: null,
  },
]

export const planShares: Tables<'plan_shares'>[] = [
  {
    id: 'ps-1',
    plan_id: 'plan-active',
    shared_with_user_id: MOCK_SHARED_USER_ID,
    shared_by_user_id: MOCK_USER_ID,
    permission_level: 'edit',
    created_at: startOfMonth.toISOString(),
  },
]

// ── Expenses ──

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateString(d)
}

export const expenses: Tables<'expenses'>[] = [
  {
    id: 'exp-1',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'Weekly groceries at Lidl',
    amount: 67.5,
    category_id: 'cat-food',
    plan_item_id: 'pi-1',
    expense_date: daysAgo(1),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-2',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'Bus monthly pass',
    amount: 80,
    category_id: 'cat-transport',
    plan_item_id: 'pi-2',
    expense_date: daysAgo(5),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-3',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'Netflix subscription',
    amount: 15.99,
    category_id: 'cat-entertainment',
    plan_item_id: 'pi-3',
    expense_date: daysAgo(3),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-4',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'Spotify subscription',
    amount: 9.99,
    category_id: 'cat-entertainment',
    plan_item_id: 'pi-3',
    expense_date: daysAgo(3),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-5',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'New jacket from Zara',
    amount: 89.9,
    category_id: 'cat-shopping',
    plan_item_id: 'pi-5',
    expense_date: daysAgo(2),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-6',
    plan_id: 'plan-active',
    user_id: MOCK_USER_ID,
    name: 'Bakery croissants',
    amount: 4.5,
    category_id: 'cat-food',
    plan_item_id: 'pi-1',
    expense_date: daysAgo(0),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  // Completed plan expenses (January)
  {
    id: 'exp-7',
    plan_id: 'plan-completed',
    user_id: MOCK_USER_ID,
    name: 'January groceries',
    amount: 580,
    category_id: 'cat-food',
    plan_item_id: 'pi-6',
    expense_date: toDateString(lastMonthStart),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: lastMonthStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-8',
    plan_id: 'plan-completed',
    user_id: MOCK_USER_ID,
    name: 'January bus pass',
    amount: 80,
    category_id: 'cat-transport',
    plan_item_id: 'pi-7',
    expense_date: toDateString(lastMonthStart),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: lastMonthStart.toISOString(),
    updated_at: null,
  },
  // Weekly plan expenses
  {
    id: 'exp-9',
    plan_id: 'plan-weekly',
    user_id: MOCK_USER_ID,
    name: 'Lunch at cafe',
    amount: 14.5,
    category_id: 'cat-food',
    plan_item_id: 'pi-8',
    expense_date: daysAgo(1),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-10',
    plan_id: 'plan-weekly',
    user_id: MOCK_USER_ID,
    name: 'Cinema tickets',
    amount: 24,
    category_id: 'cat-entertainment',
    plan_item_id: 'pi-10',
    expense_date: daysAgo(0),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: new Date().toISOString(),
    updated_at: null,
  },
  // December plan expenses
  {
    id: 'exp-11',
    plan_id: 'plan-dec',
    user_id: MOCK_USER_ID,
    name: 'December groceries',
    amount: 620,
    category_id: 'cat-food',
    plan_item_id: 'pi-11',
    expense_date: toDateString(twoMonthsAgoStart),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: twoMonthsAgoStart.toISOString(),
    updated_at: null,
  },
  {
    id: 'exp-12',
    plan_id: 'plan-dec',
    user_id: MOCK_USER_ID,
    name: 'Christmas presents',
    amount: 385,
    category_id: 'cat-shopping',
    plan_item_id: 'pi-12',
    expense_date: toDateString(twoMonthsAgoEnd),
    currency: 'EUR',
    original_amount: null,
    original_currency: null,
    created_at: twoMonthsAgoEnd.toISOString(),
    updated_at: null,
  },
]

// ── RPC response data ──

export function getPlanExpenseSummaryData(planId: string): PlanExpenseSummary[] {
  const planExpenses = expenses.filter((e) => e.plan_id === planId)
  const items = planItems.filter((i) => i.plan_id === planId)

  const summaryMap = new Map<string, PlanExpenseSummary>()

  for (const item of items) {
    const existing = summaryMap.get(item.category_id)
    const planned = (existing?.planned_amount ?? 0) + item.amount
    summaryMap.set(item.category_id, {
      category_id: item.category_id,
      planned_amount: planned,
      actual_amount: 0,
      remaining_amount: planned,
      expense_count: 0,
    })
  }

  for (const exp of planExpenses) {
    const existing = summaryMap.get(exp.category_id)
    if (existing) {
      existing.actual_amount += exp.amount
      existing.remaining_amount = existing.planned_amount - existing.actual_amount
      existing.expense_count += 1
    }
  }

  return Array.from(summaryMap.values())
}

export function getPlanItemsWithTrackingData(
  planId: string,
  categoryId?: string,
): Array<
  Tables<'plan_items'> & { spent_amount: number; remaining_amount: number; expense_count: number }
> {
  let items = planItems.filter((i) => i.plan_id === planId)
  if (categoryId) {
    items = items.filter((i) => i.category_id === categoryId)
  }

  return items.map((item) => {
    const itemExpenses = expenses.filter((e) => e.plan_item_id === item.id)
    const spent = itemExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      ...item,
      updated_at: item.updated_at ?? item.created_at,
      spent_amount: spent,
      remaining_amount: item.amount - spent,
      expense_count: itemExpenses.length,
    }
  })
}

export const templateSharedUsersData: TemplateSharedUser[] = [
  {
    user_id: MOCK_USER_ID,
    user_name: 'Demo User',
    user_email: 'demo@shephard.app',
    permission_level: 'edit',
    shared_at: '2025-01-09T10:00:00Z',
  },
]

export const planSharedUsersData: PlanSharedUser[] = [
  {
    user_id: MOCK_SHARED_USER_ID,
    user_name: 'Jane Smith',
    user_email: 'jane@example.com',
    permission_level: 'edit',
    shared_at: startOfMonth.toISOString(),
  },
]
