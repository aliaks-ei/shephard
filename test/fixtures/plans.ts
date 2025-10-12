import type {
  Plan,
  PlanWithPermission,
  PlanWithItems,
  PlanItem,
  PlanSharedUser,
} from 'src/api/plans'

/**
 * Creates a mock plan with optional overrides
 */
export const createMockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  name: 'Weekly Grocery Plan',
  status: 'active',
  currency: 'USD',
  owner_id: 'user-1',
  total: 100,
  start_date: '2024-01-01',
  end_date: '2024-01-07',
  template_id: 'template-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates a mock plan with permission level
 */
export const createMockPlanWithPermission = (
  overrides: Partial<PlanWithPermission> = {},
): PlanWithPermission => ({
  ...createMockPlan(overrides),
  permission_level: 'owner',
  is_shared: false,
  ...overrides,
})

/**
 * Creates a mock plan item
 */
export const createMockPlanItem = (overrides: Partial<PlanItem> = {}): PlanItem => ({
  id: 'item-1',
  plan_id: 'plan-1',
  name: 'Milk',
  category_id: 'cat-1',
  amount: 5.99,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  is_completed: false,
  is_fixed_payment: true,
  ...overrides,
})

/**
 * Creates a mock plan with items
 */
export const createMockPlanWithItems = (
  itemCount: number = 2,
  overrides: Partial<PlanWithItems> = {},
): PlanWithItems => {
  const items = Array.from({ length: itemCount }, (_, i) =>
    createMockPlanItem({
      id: `item-${i + 1}`,
      name: ['Milk', 'Bread', 'Eggs', 'Cheese'][i] || `Item ${i + 1}`,
      category_id: `cat-${(i % 3) + 1}`,
      amount: [5.99, 3.5, 4.25, 6.75][i] || 10.0,
    }),
  )

  return {
    ...createMockPlan(overrides),
    plan_items: items,
    ...overrides,
  }
}

/**
 * Creates multiple mock plans with variety
 */
export const createMockPlans = (count: number = 3): PlanWithPermission[] => {
  const planData = [
    {
      id: 'plan-1',
      name: 'Weekly Grocery Plan',
      owner_id: 'user-1',
      permission_level: 'owner' as const,
      is_shared: false,
      end_date: '2024-01-07',
    },
    {
      id: 'plan-2',
      name: 'Monthly Budget Plan',
      owner_id: 'user-1',
      permission_level: 'edit' as const,
      is_shared: false,
      end_date: '2024-01-31',
    },
    {
      id: 'plan-3',
      name: 'Shared Family Plan',
      owner_id: 'user-2',
      permission_level: 'view' as const,
      is_shared: true,
      end_date: '2024-01-14',
    },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockPlanWithPermission({
      ...(planData[i] || {
        id: `plan-${i + 1}`,
        name: `Plan ${i + 1}`,
        owner_id: 'user-1',
        permission_level: 'owner' as const,
        is_shared: false,
      }),
    }),
  )
}

/**
 * Creates a mock plan shared user
 */
export const createMockPlanSharedUser = (
  overrides: Partial<PlanSharedUser> = {},
): PlanSharedUser => ({
  user_id: 'user-2',
  user_name: 'John Doe',
  user_email: 'john@example.com',
  permission_level: 'edit',
  shared_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates multiple mock plan shared users
 */
export const createMockPlanSharedUsers = (count: number = 2): PlanSharedUser[] => {
  const userData = [
    { user_id: 'user-2', user_name: 'John Doe', user_email: 'john@example.com' },
    { user_id: 'user-3', user_name: 'Jane Smith', user_email: 'jane@example.com' },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockPlanSharedUser({
      ...(userData[i] || {
        user_id: `user-${i + 2}`,
        user_name: `User ${i + 2}`,
        user_email: `user${i + 2}@example.com`,
      }),
    }),
  )
}
