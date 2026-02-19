import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useTemplate } from './useTemplate'
import { useUserStore } from 'src/stores/user'
import type { TemplateWithItems } from 'src/api'
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
  theme: 'light' as const,
  pushNotificationsEnabled: true,
  isPrivacyModeEnabled: false,
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

const {
  mockCreateTemplateMutation,
  mockUpdateTemplateMutation,
  mockCreateItemsMutation,
  mockDeleteItemsMutation,
  mockTemplateDetailQuery,
} = vi.hoisted(() => ({
  mockCreateTemplateMutation: { mutateAsync: vi.fn() },
  mockUpdateTemplateMutation: { mutateAsync: vi.fn() },
  mockCreateItemsMutation: { mutateAsync: vi.fn() },
  mockDeleteItemsMutation: { mutateAsync: vi.fn() },
  mockTemplateDetailQuery: {
    data: { value: null as unknown },
    refetch: vi.fn(),
    isPending: { value: false },
  },
}))

vi.mock('src/queries/templates', () => ({
  useTemplateDetailQuery: () => mockTemplateDetailQuery,
  useCreateTemplateMutation: () => mockCreateTemplateMutation,
  useUpdateTemplateMutation: () => mockUpdateTemplateMutation,
  useCreateTemplateItemsMutation: () => mockCreateItemsMutation,
  useDeleteTemplateItemsMutation: () => mockDeleteItemsMutation,
}))

beforeEach(() => {
  setupTestingPinia()
  mockRoute.value = {
    name: 'template',
    params: { id: 'template-123' },
  }

  mockCreateTemplateMutation.mutateAsync.mockReset()
  mockUpdateTemplateMutation.mutateAsync.mockReset()
  mockCreateItemsMutation.mutateAsync.mockReset()
  mockDeleteItemsMutation.mutateAsync.mockReset()
  mockTemplateDetailQuery.refetch.mockReset()
  mockTemplateDetailQuery.data.value = null
})

describe('computed properties', () => {
  it('identifies new template correctly', () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { isNewTemplate } = useTemplate()

    expect(isNewTemplate.value).toBe(true)
  })

  it('identifies existing template correctly', () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const { isNewTemplate } = useTemplate()

    expect(isNewTemplate.value).toBe(false)
  })

  it('extracts route template ID correctly', () => {
    mockRoute.value = { name: 'template', params: { id: 'template-456' } }

    const { routeTemplateId } = useTemplate()

    expect(routeTemplateId.value).toBe('template-456')
  })

  it('handles non-string route ID', () => {
    mockRoute.value = { name: 'template', params: { id: ['array-id'] } }

    const { routeTemplateId } = useTemplate()

    expect(routeTemplateId.value).toBeNull()
  })

  it('handles missing route ID', () => {
    mockRoute.value = { name: 'template', params: {} }

    const { routeTemplateId } = useTemplate()

    expect(routeTemplateId.value).toBeNull()
  })
})

describe('ownership and permissions', () => {
  it('identifies owner correctly', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(true)
  })

  it('identifies non-owner correctly', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(false)
  })

  it('handles missing user profile', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = null

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(false)
  })

  it('handles missing current template', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = null

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(false)
  })
})

describe('read-only mode detection', () => {
  it('allows editing for template owners', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('enforces read-only for view permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'view',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(false)
  })

  it('allows editing for edit permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'edit',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })
})

describe('edit mode detection', () => {
  it('enables edit mode for new templates', () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('enables edit mode for template owners', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('enables edit mode for edit permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'edit',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('disables edit mode for view permission', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'view',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(false)
  })
})

describe('template currency', () => {
  it('uses user preference currency for new templates', () => {
    mockRoute.value = { name: 'new-template', params: {} }
    const userStore = useUserStore()

    vi.mocked(userStore).preferences.preferences = createMockPreferences('EUR')

    const { templateCurrency } = useTemplate()

    expect(templateCurrency.value).toBe('EUR')
  })

  it('uses template currency for existing templates', () => {
    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'GBP',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { templateCurrency } = useTemplate()

    expect(templateCurrency.value).toBe('GBP')
  })
})

describe('createNewTemplateWithItems', () => {
  it('creates template and items successfully', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const mockTemplate = { id: 'new-template-id', name: 'Test Template' }
    const mockItems = [
      { name: 'Item 1', category_id: 'cat-1', amount: 100, is_fixed_payment: true },
      { name: 'Item 2', category_id: 'cat-2', amount: 200, is_fixed_payment: true },
    ]

    mockCreateTemplateMutation.mutateAsync.mockResolvedValue(mockTemplate)
    mockCreateItemsMutation.mutateAsync.mockResolvedValue([])

    const { createNewTemplateWithItems } = useTemplate()

    const result = await createNewTemplateWithItems(
      'Test Template',
      'monthly',
      'EUR',
      300,
      mockItems,
    )

    expect(result.success).toBe(true)
    expect(mockCreateTemplateMutation.mutateAsync).toHaveBeenCalledWith({
      name: 'Test Template',
      duration: 'monthly',
      currency: 'EUR',
      total: 300,
      owner_id: 'user-123',
    })
    expect(mockCreateItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'new-template-id',
      items: [
        {
          name: 'Item 1',
          category_id: 'cat-1',
          amount: 100,
          is_fixed_payment: true,
          template_id: 'new-template-id',
        },
        {
          name: 'Item 2',
          category_id: 'cat-2',
          amount: 200,
          is_fixed_payment: true,
          template_id: 'new-template-id',
        },
      ],
    })
  })

  it('returns false when template creation fails', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockCreateTemplateMutation.mutateAsync.mockRejectedValue(new Error('fail'))

    const { createNewTemplateWithItems } = useTemplate()

    const result = await createNewTemplateWithItems('Test Template', 'monthly', 'EUR', 300, [])

    expect(result.success).toBe(false)
    expect(mockCreateItemsMutation.mutateAsync).not.toHaveBeenCalled()
  })

  it('handles template creation with no items', async () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    const mockTemplate = { id: 'new-template-id', name: 'Test Template' }

    mockCreateTemplateMutation.mutateAsync.mockResolvedValue(mockTemplate)
    mockCreateItemsMutation.mutateAsync.mockResolvedValue([])

    const { createNewTemplateWithItems } = useTemplate()

    const result = await createNewTemplateWithItems('Test Template', 'monthly', 'EUR', 0, [])

    expect(result.success).toBe(true)
    expect(mockCreateItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'new-template-id',
      items: [],
    })
  })
})

describe('updateExistingTemplateWithItems', () => {
  it('updates template and replaces items successfully', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const existingItems = [
      { id: 'item-1', name: 'Old Item 1' },
      { id: 'item-2', name: 'Old Item 2' },
    ]
    const newItems = [
      { name: 'New Item 1', category_id: 'cat-1', amount: 150, is_fixed_payment: true },
      { name: 'New Item 2', category_id: 'cat-2', amount: 250, is_fixed_payment: true },
    ]

    mockTemplateDetailQuery.data.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: existingItems,
    } as TemplateWithItems

    const mockTemplate = { id: 'template-123', name: 'Updated Template' }
    mockUpdateTemplateMutation.mutateAsync.mockResolvedValue(mockTemplate)
    mockDeleteItemsMutation.mutateAsync.mockResolvedValue(undefined)
    mockCreateItemsMutation.mutateAsync.mockResolvedValue([])

    const { updateExistingTemplateWithItems } = useTemplate()

    const result = await updateExistingTemplateWithItems(
      'Updated Template',
      'weekly',
      'EUR',
      400,
      newItems,
    )

    expect(result.success).toBe(true)
    expect(mockUpdateTemplateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'template-123',
      updates: {
        name: 'Updated Template',
        duration: 'weekly',
        currency: 'EUR',
        total: 400,
      },
    })
    expect(mockDeleteItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-123',
      ids: ['item-1', 'item-2'],
    })
    expect(mockCreateItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-123',
      items: [
        {
          name: 'New Item 1',
          category_id: 'cat-1',
          amount: 150,
          is_fixed_payment: true,
          template_id: 'template-123',
        },
        {
          name: 'New Item 2',
          category_id: 'cat-2',
          amount: 250,
          is_fixed_payment: true,
          template_id: 'template-123',
        },
      ],
    })
  })

  it('returns false when no route template ID', async () => {
    mockRoute.value = { name: 'template', params: {} }

    const { updateExistingTemplateWithItems } = useTemplate()

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 'EUR', 100, [])

    expect(result.success).toBe(false)
  })

  it('returns false when no current template', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    mockTemplateDetailQuery.data.value = null

    const { updateExistingTemplateWithItems } = useTemplate()

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 'EUR', 100, [])

    expect(result.success).toBe(false)
  })

  it('returns false when template update fails', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    mockTemplateDetailQuery.data.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { updateExistingTemplateWithItems } = useTemplate()

    mockUpdateTemplateMutation.mutateAsync.mockRejectedValue(new Error('fail'))

    const result = await updateExistingTemplateWithItems('Test', 'monthly', 'EUR', 100, [])

    expect(result.success).toBe(false)
  })

  it('handles update with no new items', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const existingItems = [{ id: 'item-1', name: 'Old Item' }]

    mockTemplateDetailQuery.data.value = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: existingItems,
    } as TemplateWithItems

    const mockTemplate = { id: 'template-123', name: 'Updated Template' }
    mockUpdateTemplateMutation.mutateAsync.mockResolvedValue(mockTemplate)
    mockDeleteItemsMutation.mutateAsync.mockResolvedValue(undefined)

    const { updateExistingTemplateWithItems } = useTemplate()

    const result = await updateExistingTemplateWithItems('Updated Template', 'weekly', 'EUR', 0, [])

    expect(result.success).toBe(true)
    expect(mockDeleteItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-123',
      ids: ['item-1'],
    })
    expect(mockCreateItemsMutation.mutateAsync).not.toHaveBeenCalled()
  })
})

describe('loadTemplate', () => {
  it('returns null for new templates', async () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const { loadTemplate } = useTemplate()

    const result = await loadTemplate()

    expect(result).toBeNull()
  })

  it('returns null when no route template ID', async () => {
    mockRoute.value = { name: 'template', params: {} }

    const { loadTemplate } = useTemplate()

    const result = await loadTemplate()

    expect(result).toBeNull()
  })

  it('loads template successfully', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    const mockTemplate = {
      id: 'template-123',
      owner_id: 'user-123',
      name: 'Loaded Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    mockTemplateDetailQuery.refetch.mockImplementation(() => {
      mockTemplateDetailQuery.data.value = mockTemplate
      return Promise.resolve({ data: mockTemplate })
    })

    const { currentTemplate, loadTemplate } = useTemplate()

    const result = await loadTemplate()

    expect(result).toEqual(mockTemplate)
    expect(currentTemplate.value).toEqual(mockTemplate)
    expect(mockTemplateDetailQuery.refetch).toHaveBeenCalled()
  })

  it('handles load failure', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-123' } }

    mockTemplateDetailQuery.refetch.mockImplementation(() => {
      mockTemplateDetailQuery.data.value = null
      return Promise.resolve({ data: null })
    })

    const { currentTemplate, loadTemplate } = useTemplate()

    const result = await loadTemplate()

    expect(result).toBeNull()
    expect(currentTemplate.value).toBeNull()
  })
})

describe('reactivity', () => {
  it('derives owner and currency from current template', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'GBP',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isOwner, templateCurrency } = useTemplate()

    expect(isOwner.value).toBe(true)
    expect(templateCurrency.value).toBe('GBP')
  })

  it('derives owner as false when no template data', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = null

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(false)
  })

  it('derives edit mode from permission level view', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'view',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(false)
  })

  it('derives edit mode from permission level edit', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-456',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
      permission_level: 'edit',
    }

    const { isEditMode } = useTemplate()

    expect(isEditMode.value).toBe(true)
  })

  it('derives owner from template data', () => {
    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')

    mockTemplateDetailQuery.data.value = {
      id: 'template-1',
      owner_id: 'user-123',
      name: 'Test Template',
      duration: 'monthly',
      total: 1000,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      template_items: [],
    }

    const { isOwner } = useTemplate()

    expect(isOwner.value).toBe(true)
  })
})

describe('integration scenarios', () => {
  it('handles complete new template creation workflow', async () => {
    mockRoute.value = { name: 'new-template', params: {} }

    const userStore = useUserStore()
    vi.mocked(userStore).userProfile = createMockUserProfile('user-123')
    vi.mocked(userStore).preferences.preferences = createMockPreferences('EUR')

    const mockTemplate = { id: 'new-template-id', name: 'My Budget' }
    const templateItems = [
      { name: 'Groceries', category_id: 'food-cat', amount: 400, is_fixed_payment: true },
      { name: 'Rent', category_id: 'housing-cat', amount: 1200, is_fixed_payment: true },
    ]

    mockCreateTemplateMutation.mutateAsync.mockResolvedValue(mockTemplate)
    mockCreateItemsMutation.mutateAsync.mockResolvedValue([])

    const { isNewTemplate, templateCurrency, createNewTemplateWithItems } = useTemplate()

    expect(isNewTemplate.value).toBe(true)
    expect(templateCurrency.value).toBe('EUR')

    const result = await createNewTemplateWithItems(
      'My Budget',
      'monthly',
      'EUR',
      1600,
      templateItems,
    )

    expect(result.success).toBe(true)
    expect(mockCreateTemplateMutation.mutateAsync).toHaveBeenCalledWith({
      name: 'My Budget',
      duration: 'monthly',
      currency: 'EUR',
      total: 1600,
      owner_id: 'user-123',
    })
    expect(mockCreateItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'new-template-id',
      items: [
        {
          name: 'Groceries',
          category_id: 'food-cat',
          amount: 400,
          is_fixed_payment: true,
          template_id: 'new-template-id',
        },
        {
          name: 'Rent',
          category_id: 'housing-cat',
          amount: 1200,
          is_fixed_payment: true,
          template_id: 'new-template-id',
        },
      ],
    })
  })

  it('handles complete existing template edit workflow', async () => {
    mockRoute.value = { name: 'template', params: { id: 'template-456' } }

    const userStore = useUserStore()
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
      template_items: [
        { id: 'item-1', name: 'Old Item 1' },
        { id: 'item-2', name: 'Old Item 2' },
      ],
    } as TemplateWithItems

    const updatedTemplate = { id: 'template-456', name: 'New Budget' }
    const newItems = [
      { name: 'Updated Groceries', category_id: 'food-cat', amount: 500, is_fixed_payment: true },
    ]

    mockTemplateDetailQuery.refetch.mockImplementation(() => {
      mockTemplateDetailQuery.data.value = existingTemplate
      return Promise.resolve({ data: existingTemplate })
    })
    mockUpdateTemplateMutation.mutateAsync.mockResolvedValue(updatedTemplate)
    mockDeleteItemsMutation.mutateAsync.mockResolvedValue(undefined)
    mockCreateItemsMutation.mutateAsync.mockResolvedValue([])

    const {
      isNewTemplate,
      isOwner,
      isEditMode,
      templateCurrency,
      loadTemplate,
      updateExistingTemplateWithItems,
    } = useTemplate()

    expect(isNewTemplate.value).toBe(false)

    const loadResult = await loadTemplate()
    expect(loadResult).toEqual(existingTemplate)
    expect(isOwner.value).toBe(true)
    expect(isEditMode.value).toBe(true)
    expect(templateCurrency.value).toBe('USD')

    const updateResult = await updateExistingTemplateWithItems(
      'New Budget',
      'weekly',
      'EUR',
      500,
      newItems,
    )

    expect(updateResult.success).toBe(true)
    expect(mockUpdateTemplateMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'template-456',
      updates: {
        name: 'New Budget',
        duration: 'weekly',
        currency: 'EUR',
        total: 500,
      },
    })
    expect(mockDeleteItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-456',
      ids: ['item-1', 'item-2'],
    })
    expect(mockCreateItemsMutation.mutateAsync).toHaveBeenCalledWith({
      templateId: 'template-456',
      items: [
        {
          name: 'Updated Groceries',
          category_id: 'food-cat',
          amount: 500,
          is_fixed_payment: true,
          template_id: 'template-456',
        },
      ],
    })
  })

  it('handles shared template with view permission', async () => {
    mockRoute.value = { name: 'template', params: { id: 'shared-template' } }

    const userStore = useUserStore()
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
      template_items: [],
      permission_level: 'view',
    } as TemplateWithItems & { permission_level: string }

    mockTemplateDetailQuery.refetch.mockImplementation(() => {
      mockTemplateDetailQuery.data.value = sharedTemplate
      return Promise.resolve({ data: sharedTemplate })
    })

    const { isOwner, isEditMode, templateCurrency, loadTemplate } = useTemplate()

    const loadResult = await loadTemplate()
    expect(loadResult).toEqual(sharedTemplate)
    expect(isOwner.value).toBe(false)
    expect(isEditMode.value).toBe(false)
    expect(templateCurrency.value).toBe('GBP')
  })
})
