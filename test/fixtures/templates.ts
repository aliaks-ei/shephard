import type {
  ExpenseTemplate,
  ExpenseTemplateWithPermission,
  ExpenseTemplateWithItems,
  ExpenseTemplateItem,
  TemplateSharedUser,
} from 'src/api/templates'

/**
 * Creates a mock expense template with optional overrides
 */
export const createMockTemplate = (overrides: Partial<ExpenseTemplate> = {}): ExpenseTemplate => ({
  id: 'template-1',
  name: 'Grocery Shopping',
  duration: 'weekly',
  currency: 'USD',
  owner_id: 'user-1',
  total: 100,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates a mock expense template with permission level
 */
export const createMockTemplateWithPermission = (
  overrides: Partial<ExpenseTemplateWithPermission> = {},
): ExpenseTemplateWithPermission => ({
  ...createMockTemplate(overrides),
  permission_level: 'owner',
  is_shared: false,
  ...overrides,
})

/**
 * Creates a mock template item
 */
export const createMockTemplateItem = (
  overrides: Partial<ExpenseTemplateItem> = {},
): ExpenseTemplateItem => ({
  id: 'item-1',
  template_id: 'template-1',
  name: 'Milk',
  category_id: 'cat-1',
  amount: 5.99,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates a mock template with items
 */
export const createMockTemplateWithItems = (
  itemCount: number = 2,
  overrides: Partial<ExpenseTemplateWithItems> = {},
): ExpenseTemplateWithItems => {
  const items = Array.from({ length: itemCount }, (_, i) =>
    createMockTemplateItem({
      id: `item-${i + 1}`,
      name: ['Milk', 'Bread', 'Eggs', 'Cheese'][i] || `Item ${i + 1}`,
      category_id: `cat-${(i % 3) + 1}`,
      amount: [5.99, 3.5, 4.25, 6.75][i] || 10.0,
    }),
  )

  return {
    ...createMockTemplate(overrides),
    expense_template_items: items,
    ...overrides,
  }
}

/**
 * Creates multiple mock templates with variety
 */
export const createMockTemplates = (count: number = 3): ExpenseTemplateWithPermission[] => {
  const templateData = [
    {
      id: 'template-1',
      name: 'Grocery Shopping',
      duration: 'weekly' as const,
      owner_id: 'user-1',
      permission_level: 'owner' as const,
      is_shared: false,
      total: 100,
    },
    {
      id: 'template-2',
      name: 'Business Travel',
      duration: 'monthly' as const,
      owner_id: 'user-1',
      permission_level: 'edit' as const,
      is_shared: false,
      total: 250,
    },
    {
      id: 'template-3',
      name: 'Shared Template',
      duration: 'daily' as const,
      owner_id: 'user-2',
      permission_level: 'view' as const,
      is_shared: true,
      total: 50,
    },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockTemplateWithPermission({
      ...(templateData[i] || {
        id: `template-${i + 1}`,
        name: `Template ${i + 1}`,
        owner_id: 'user-1',
        permission_level: 'owner' as const,
        is_shared: false,
      }),
    }),
  )
}

/**
 * Creates a mock shared user for templates
 */
export const createMockSharedUser = (
  overrides: Partial<TemplateSharedUser> = {},
): TemplateSharedUser => ({
  user_id: 'user-2',
  user_name: 'John Doe',
  user_email: 'john@example.com',
  permission_level: 'edit',
  shared_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

/**
 * Creates multiple mock shared users
 */
export const createMockSharedUsers = (count: number = 2): TemplateSharedUser[] => {
  const userData = [
    { user_id: 'user-2', user_name: 'John Doe', user_email: 'john@example.com' },
    { user_id: 'user-3', user_name: 'Jane Smith', user_email: 'jane@example.com' },
  ]

  return Array.from({ length: count }, (_, i) =>
    createMockSharedUser({
      ...(userData[i] || {
        user_id: `user-${i + 2}`,
        user_name: `User ${i + 2}`,
        user_email: `user${i + 2}@example.com`,
      }),
    }),
  )
}
