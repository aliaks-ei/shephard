import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useExpenseTemplate } from './useExpenseTemplate'
import { useUserStore } from 'src/stores/user'
import { useTemplatesStore } from 'src/stores/templates'
import type { ExpenseTemplateWithItems } from 'src/api'
import { setupTestingPinia } from 'test/helpers/pinia-mocks'

// Simple inline helpers for this test
const createMockUserProfile = (id: string) => ({
  id,
  email: `user-${id}@example.com`,
  displayName: `User ${id}`,
  avatarUrl: undefined,
  nameInitial: 'U',
  authProvider: 'email' as const,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  isEmailVerified: true,
  formattedCreatedAt: 'Jan 1, 2024',
  preferences: createMockPreferences(),
})

const createMockPreferences = (currency = 'USD') => ({
  currency,
  darkMode: false,
  pushNotificationsEnabled: true,
})

const mockRoute = ref<{
  name: string
  params: Record<string, string | string[] | undefined>
}>({
  name: 'template',
  params: { id: 'template-123' },
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
}))

beforeEach(() => {
  setupTestingPinia()
  mockRoute.value = {
    name: 'template',
    params: { id: 'template-123' },
  }
})

describe('computed properties', () => {
  it('identifies new template correctly', () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { isNewTemplate } = useExpenseTemplate()

    expect(isNewTemplate.value).toBe(true)
  })

  it('identifies existing template correctly', () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const { isNewTemplate } = useExpenseTemplate()

    expect(isNewTemplate.value).toBe(false)
  })

  it('extracts route template ID correctly', () => {
    mockRoute.value = { name: 'template', params: { id: 'template-456' } }

    const { routeTemplateId } = useExpenseTemplate()

    expect(routeTemplateId.value).toBe('template-456')
  })

  it('handles non-string route ID', () => {
    mockRoute.value = { name: 'template', params: { id: ['array-id'] } }

    const { routeTemplateId } = useExpenseTemplate()

    expect(routeTemplateId.value).toBeNull()
  })

  it('handles missing route ID', () => {
    mockRoute.value = { name: 'template', params: {} }

    const { routeTemplateId } = useExpenseTemplate()

    expect(routeTemplateId.value).toBeNull()
  })
})

describe('ownership and permissions', () => {
  it('identifies owner correctly', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isOwner } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(isOwner.value).toBe(true)
  })

  it('identifies non-owner correctly', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isOwner } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(isOwner.value).toBe(false)
  })

  it('handles missing user profile', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = null

    const { currentTemplate, isOwner } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(isOwner.value).toBe(false)
  })

  it('handles missing current template', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isOwner } = useExpenseTemplate()

    currentTemplate.value = null

    expect(isOwner.value).toBe(false)
  })
})

describe('read-only mode detection', () => {
  it('allows editing for new templates', () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { isReadOnlyMode } = useExpenseTemplate()

    expect(isReadOnlyMode.value).toBe(false)
  })

  it('allows editing for template owners', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isReadOnlyMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(isReadOnlyMode.value).toBe(false)
  })

  it('enforces read-only for view permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isReadOnlyMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'view',
    }

    expect(isReadOnlyMode.value).toBe(true)
  })

  it('allows editing for edit permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isReadOnlyMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'edit',
    }

    expect(isReadOnlyMode.value).toBe(false)
  })
})

describe('edit mode detection', () => {
  it('enables edit mode for new templates', () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { isEditMode } = useExpenseTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('enables edit mode for template owners', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isEditMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(isEditMode.value).toBe(true)
  })

  it('enables edit mode for edit permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isEditMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'edit',
    }

    expect(isEditMode.value).toBe(true)
  })

  it('disables edit mode for view permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isEditMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'view',
    }

    expect(isEditMode.value).toBe(false)
  })
})

describe('template currency', () => {
  it('uses user preference currency for new templates', () => {
    mockRoute.value = { name: 'new-template', params: {} }
    const userStore = useUserStore()

    vi.mocked(userStore).preferences.preferences = createMockPreferences('EUR')

    const { templateCurrency } = useExpenseTemplate()

    expect(templateCurrency.value).toBe('EUR')
  })

  it('uses template currency for existing templates', () => {
    const { currentTemplate, templateCurrency } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'GBP',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    expect(templateCurrency.value).toBe('GBP')
  })
})

describe('createNewTemplateWithItems', () => {
  it('creates template and items successfully', async () => {
    const templatesStore = useTemplatesStore()
    const mockTemplate = { id: 'new-template-id', name: 'Test Template' }
    const mockItems = [
      { name: 'Item 1', category_id: 'cat-1', amount: 100 },
      { name: 'Item 2', category_id: 'cat-2', amount: 200 },
    ]

    templatesStore.addTemplate = vi.fn().mockResolvedValue(mockTemplate)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const { createNewTemplateWithItems } = useExpenseTemplate()

    const result = await createNewTemplateWithItems('Test Template', 'monthly', 300, mockItems)

    expect(result).toBe(true)
    expect(templatesStore.addTemplate).toHaveBeenCalledWith({
      name: 'Test Template',
      duration: 'monthly',
      total: 300,
    })
    expect(templatesStore.addItemsToTemplate).toHaveBeenCalledWith([
      { name: 'Item 1', category_id: 'cat-1', amount: 100, template_id: 'new-template-id' },
      { name: 'Item 2', category_id: 'cat-2', amount: 200, template_id: 'new-template-id' },
    ])
  })

  it('returns false when template creation fails', async () => {
    const templatesStore = useTemplatesStore()

    templatesStore.addTemplate = vi.fn().mockResolvedValue(null)

    const { createNewTemplateWithItems } = useExpenseTemplate()

    const result = await createNewTemplateWithItems('Test Template', 'monthly', 300, [])

    expect(result).toBe(false)
    expect(templatesStore.addItemsToTemplate).not.toHaveBeenCalled()
  })

  it('handles template creation with no items', async () => {
    const templatesStore = useTemplatesStore()
    const mockTemplate = { id: 'new-template-id', name: 'Test Template' }

    templatesStore.addTemplate = vi.fn().mockResolvedValue(mockTemplate)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const { createNewTemplateWithItems } = useExpenseTemplate()

    const result = await createNewTemplateWithItems('Test Template', 'monthly', 0, [])

    expect(result).toBe(true)
    expect(templatesStore.addItemsToTemplate).toHaveBeenCalledWith([])
  })
})

describe('updateExistingTemplateWithItems', () => {
  it('updates template and replaces items successfully', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const templatesStore = useTemplatesStore()
    const { currentTemplate, updateExistingTemplateWithItems } = useExpenseTemplate()

    const mockTemplate = { id: 'template-123', name: 'Updated Template' }
    const existingItems = [
      { id: 'item-1', name: 'Old Item 1' },
      { id: 'item-2', name: 'Old Item 2' },
    ]
    const newItems = [
      { name: 'New Item 1', category_id: 'cat-1', amount: 150 },
      { name: 'New Item 2', category_id: 'cat-2', amount: 250 },
    ]

    currentTemplate.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: existingItems,
    } as ExpenseTemplateWithItems

    templatesStore.editTemplate = vi.fn().mockResolvedValue(mockTemplate)
    templatesStore.removeItemsFromTemplate = vi.fn().mockResolvedValue(undefined)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const result = await updateExistingTemplateWithItems(
      'Updated Template',
      'weekly',
      400,
      newItems,
    )

    expect(result).toBe(true)
    expect(templatesStore.editTemplate).toHaveBeenCalledWith('template-123', {
      name: 'Updated Template',
      duration: 'weekly',
      total: 400,
    })
    expect(templatesStore.removeItemsFromTemplate).toHaveBeenCalledWith(['item-1', 'item-2'])
    expect(templatesStore.addItemsToTemplate).toHaveBeenCalledWith([
      { name: 'New Item 1', category_id: 'cat-1', amount: 150, template_id: 'template-123' },
      { name: 'New Item 2', category_id: 'cat-2', amount: 250, template_id: 'template-123' },
    ])
  })

  it('returns false when no route template ID', async () => {
    mockRoute.value = { name: 'template', params: {} }

    const { updateExistingTemplateWithItems } = useExpenseTemplate()

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 100, [])

    expect(result).toBe(false)
  })

  it('returns false when no current template', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const { currentTemplate, updateExistingTemplateWithItems } = useExpenseTemplate()

    currentTemplate.value = null

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 100, [])

    expect(result).toBe(false)
  })

  it('returns false when template update fails', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const templatesStore = useTemplatesStore()
    const { currentTemplate, updateExistingTemplateWithItems } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    templatesStore.editTemplate = vi.fn().mockResolvedValue(null)

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 100, [])

    expect(result).toBe(false)
  })

  it('handles update with no new items', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const templatesStore = useTemplatesStore()
    const { currentTemplate, updateExistingTemplateWithItems } = useExpenseTemplate()

    const mockTemplate = { id: 'template-123', name: 'Updated Template' }
    const existingItems = [{ id: 'item-1', name: 'Old Item' }]

    currentTemplate.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: existingItems,
    } as ExpenseTemplateWithItems

    templatesStore.editTemplate = vi.fn().mockResolvedValue(mockTemplate)
    templatesStore.removeItemsFromTemplate = vi.fn().mockResolvedValue(undefined)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const result = await updateExistingTemplateWithItems('Updated Template', 'weekly', 0, [])

    expect(result).toBe(true)
    expect(templatesStore.removeItemsFromTemplate).toHaveBeenCalledWith(['item-1'])
    expect(templatesStore.addItemsToTemplate).not.toHaveBeenCalled()
  })
})

describe('loadTemplate', () => {
  it('returns null for new templates', async () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { loadTemplate } = useExpenseTemplate()

    const result = await loadTemplate()

    expect(result).toBeNull()
  })

  it('returns null when no route template ID', async () => {
    mockRoute.value = { name: 'template', params: {} }

    const { loadTemplate } = useExpenseTemplate()

    const result = await loadTemplate()

    expect(result).toBeNull()
  })

  it('loads template successfully', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const templatesStore = useTemplatesStore()
    const { currentTemplate, loadTemplate } = useExpenseTemplate()

    const mockTemplate = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Loaded Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    templatesStore.loadTemplateWithItems = vi.fn().mockResolvedValue(mockTemplate)

    const result = await loadTemplate()

    expect(result).toEqual(mockTemplate)
    expect(currentTemplate.value).toEqual(mockTemplate)
    expect(templatesStore.loadTemplateWithItems).toHaveBeenCalledWith('template-123')
  })

  it('handles load failure', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const templatesStore = useTemplatesStore()
    const { currentTemplate, loadTemplate } = useExpenseTemplate()

    templatesStore.loadTemplateWithItems = vi.fn().mockResolvedValue(null)

    const result = await loadTemplate()

    expect(result).toBeNull()
    expect(currentTemplate.value).toBeNull()
  })
})

describe('reactivity', () => {
  it('reacts to current template changes', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isOwner, templateCurrency } = useExpenseTemplate()

    expect(isOwner.value).toBe(false)
    expect(templateCurrency.value).toBeUndefined()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'EUR',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    await nextTick()

    expect(isOwner.value).toBe(true)
    expect(templateCurrency.value).toBe('EUR')
  })

  it('reacts to permission level changes', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isReadOnlyMode, isEditMode } = useExpenseTemplate()

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'view',
    }

    await nextTick()

    expect(isReadOnlyMode.value).toBe(true)
    expect(isEditMode.value).toBe(false)

    currentTemplate.value.permission_level = 'edit'
    await nextTick()

    expect(isReadOnlyMode.value).toBe(false)
    expect(isEditMode.value).toBe(true)
  })

  it('reacts to template loading state', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const { currentTemplate, isOwner } = useExpenseTemplate()

    expect(isOwner.value).toBe(false)

    currentTemplate.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
    }

    await nextTick()

    expect(isOwner.value).toBe(true)

    currentTemplate.value = null
    await nextTick()

    expect(isOwner.value).toBe(false)
  })
})

describe('integration scenarios', () => {
  it('handles complete new template creation workflow', async () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const userStore = useUserStore()
    const templatesStore = useTemplatesStore()

    vi.mocked(userStore).preferences.preferences = createMockPreferences('EUR')

    const mockTemplate = { id: 'new-template-id', name: 'My Budget' }
    const templateItems = [
      { name: 'Groceries', category_id: 'food-cat', amount: 400 },
      { name: 'Rent', category_id: 'housing-cat', amount: 1200 },
    ]

    templatesStore.addTemplate = vi.fn().mockResolvedValue(mockTemplate)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const { isNewTemplate, templateCurrency, createNewTemplateWithItems } = useExpenseTemplate()

    expect(isNewTemplate.value).toBe(true)
    expect(templateCurrency.value).toBe('EUR')

    const result = await createNewTemplateWithItems('My Budget', 'monthly', 1600, templateItems)

    expect(result).toBe(true)
    expect(templatesStore.addTemplate).toHaveBeenCalledWith({
      name: 'My Budget',
      duration: 'monthly',
      total: 1600,
    })
    expect(templatesStore.addItemsToTemplate).toHaveBeenCalledWith([
      { name: 'Groceries', category_id: 'food-cat', amount: 400, template_id: 'new-template-id' },
      { name: 'Rent', category_id: 'housing-cat', amount: 1200, template_id: 'new-template-id' },
    ])
  })

  it('handles complete existing template edit workflow', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-456' } }

    const userStore = useUserStore()
    const templatesStore = useTemplatesStore()

    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const existingTemplate = {
      id: 'template-456',
      owner_id: 'user-123',
      name: 'Old Budget',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [
        { id: 'item-1', name: 'Old Item 1' },
        { id: 'item-2', name: 'Old Item 2' },
      ],
    } as ExpenseTemplateWithItems

    const updatedTemplate = { id: 'template-456', name: 'New Budget' }
    const newItems = [{ name: 'Updated Groceries', category_id: 'food-cat', amount: 500 }]

    templatesStore.loadTemplateWithItems = vi.fn().mockResolvedValue(existingTemplate)
    templatesStore.editTemplate = vi.fn().mockResolvedValue(updatedTemplate)
    templatesStore.removeItemsFromTemplate = vi.fn().mockResolvedValue(undefined)
    templatesStore.addItemsToTemplate = vi.fn().mockResolvedValue([])

    const {
      isNewTemplate,
      isOwner,
      isEditMode,
      templateCurrency,
      loadTemplate,
      updateExistingTemplateWithItems,
    } = useExpenseTemplate()

    expect(isNewTemplate.value).toBe(false)

    const loadResult = await loadTemplate()
    expect(loadResult).toEqual(existingTemplate)
    expect(isOwner.value).toBe(true)
    expect(isEditMode.value).toBe(true)
    expect(templateCurrency.value).toBe('USD')

    const updateResult = await updateExistingTemplateWithItems(
      'New Budget',
      'weekly',
      500,
      newItems,
    )

    expect(updateResult).toBe(true)
    expect(templatesStore.editTemplate).toHaveBeenCalledWith('template-456', {
      name: 'New Budget',
      duration: 'weekly',
      total: 500,
    })
    expect(templatesStore.removeItemsFromTemplate).toHaveBeenCalledWith(['item-1', 'item-2'])
    expect(templatesStore.addItemsToTemplate).toHaveBeenCalledWith([
      {
        name: 'Updated Groceries',
        category_id: 'food-cat',
        amount: 500,
        template_id: 'template-456',
      },
    ])
  })

  it('handles shared template with view permission', async () => {
    mockRoute.value = { name: 'template', params: { id: 'shared-template' } }

    const userStore = useUserStore()
    const templatesStore = useTemplatesStore()

    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const sharedTemplate = {
      id: 'shared-template',
      owner_id: 'user-456',
      name: 'Shared Budget',
      duration: 'monthly',
      total: 2000,
      currency: 'GBP',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      expense_template_items: [],
      permission_level: 'view',
    } as ExpenseTemplateWithItems & { permission_level: string }

    templatesStore.loadTemplateWithItems = vi.fn().mockResolvedValue(sharedTemplate)

    const { isOwner, isEditMode, isReadOnlyMode, templateCurrency, loadTemplate } =
      useExpenseTemplate()

    const loadResult = await loadTemplate()
    expect(loadResult).toEqual(sharedTemplate)
    expect(isOwner.value).toBe(false)
    expect(isEditMode.value).toBe(false)
    expect(isReadOnlyMode.value).toBe(true)
    expect(templateCurrency.value).toBe('GBP')
  })
})
