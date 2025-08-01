import { nextTick, ref } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'

import { useExpenseTemplates } from './useExpenseTemplates'
import { useTemplatesStore } from 'src/stores/templates'
import { useNotificationStore } from 'src/stores/notification'
import type { ExpenseTemplateWithPermission } from 'src/api'

installQuasarPlugin()

// Mock dependencies
const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

const mockDialog = vi.fn(() => ({ onOk: vi.fn() }))
vi.mock('quasar', () => ({
  useQuasar: () => ({
    dialog: mockDialog,
  }),
  Dark: {
    set: vi.fn(),
  },
  Quasar: {},
}))

vi.mock('src/utils/expense-templates', () => ({
  filterAndSortTemplates: vi.fn((templates, searchQuery, sortBy) => {
    // Simple mock implementation for testing
    let filtered = templates
    if (searchQuery) {
      filtered = templates.filter((t: ExpenseTemplateWithPermission) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    return filtered.sort((a: ExpenseTemplateWithPermission, b: ExpenseTemplateWithPermission) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }),
}))

let pinia: TestingPinia

const mockTemplates: ExpenseTemplateWithPermission[] = [
  {
    id: 'template1',
    name: 'Grocery Shopping',
    currency: 'USD',
    duration: 'monthly',
    total: 100,
    owner_id: 'user1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    permission_level: 'edit',
    is_shared: false,
  },
  {
    id: 'template2',
    name: 'Business Travel',
    currency: 'USD',
    duration: 'weekly',
    total: 250,
    owner_id: 'user1',
    created_at: '2024-01-02',
    updated_at: '2024-01-02',
    permission_level: 'edit',
    is_shared: false,
  },
  {
    id: 'template3',
    name: 'Shared Template',
    currency: 'USD',
    duration: 'daily',
    total: 50,
    owner_id: 'user2',
    created_at: '2024-01-03',
    updated_at: '2024-01-03',
    permission_level: 'view',
    is_shared: true,
  },
]

describe('useExpenseTemplates', () => {
  let templatesStore: ReturnType<typeof useTemplatesStore>
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    vi.clearAllMocks()
    pinia = createTestingPinia({ createSpy: vi.fn })
    setActivePinia(pinia)

    templatesStore = useTemplatesStore()
    notificationStore = useNotificationStore()

    // Setup default store state
    // @ts-expect-error - Testing Pinia
    templatesStore.templates = ref([...mockTemplates])
    // @ts-expect-error - Testing Pinia
    templatesStore.isLoading = ref(false)
    // @ts-expect-error - Testing Pinia
    templatesStore.ownedTemplates = ref(mockTemplates.filter((t) => t.owner_id === 'user1'))
    // @ts-expect-error - Testing Pinia
    templatesStore.sharedTemplates = ref(mockTemplates.filter((t) => t.owner_id !== 'user1'))
  })

  it('should initialize with default state', () => {
    const composable = useExpenseTemplates()

    expect(composable.searchQuery.value).toBe('')
    expect(composable.sortBy.value).toBe('name')
  })

  describe('computed properties', () => {
    it('should compute areTemplatesLoading correctly when loading with no templates', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.areTemplatesLoading.value).toBe(true)
    })

    it('should compute areTemplatesLoading correctly when loading with existing templates', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref(mockTemplates)

      const composable = useExpenseTemplates()

      expect(composable.areTemplatesLoading.value).toBe(false)
    })

    it('should compute areTemplatesLoading correctly when not loading', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(false)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.areTemplatesLoading.value).toBe(false)
    })

    it('should filter and sort owned templates', () => {
      const composable = useExpenseTemplates()

      // The mock sorts by name, so we expect the result to be sorted
      const expectedTemplates = mockTemplates
        .filter((t) => t.owner_id === 'user1')
        .sort((a, b) => a.name.localeCompare(b.name))

      expect(composable.filteredAndSortedOwnedTemplates.value).toEqual(expectedTemplates)
    })

    it('should filter and sort shared templates', () => {
      const composable = useExpenseTemplates()

      expect(composable.filteredAndSortedSharedTemplates.value).toEqual(
        mockTemplates.filter((t) => t.owner_id !== 'user1'),
      )
    })

    it('should compute hasTemplates correctly when templates exist', () => {
      const composable = useExpenseTemplates()

      expect(composable.hasTemplates.value).toBe(true)
    })

    it('should compute hasTemplates correctly when no templates exist', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.ownedTemplates = ref([])
      // @ts-expect-error - Testing Pinia
      templatesStore.sharedTemplates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.hasTemplates.value).toBe(false)
    })
  })

  describe('search and filter functionality', () => {
    it('should update filtered templates when search query changes', async () => {
      const composable = useExpenseTemplates()

      composable.searchQuery.value = 'grocery'
      await nextTick()

      // The mock filterAndSortTemplates should be called with search query
      expect(composable.filteredAndSortedOwnedTemplates.value).toBeDefined()
      expect(composable.filteredAndSortedSharedTemplates.value).toBeDefined()
    })

    it('should update filtered templates when sort option changes', async () => {
      const composable = useExpenseTemplates()

      composable.sortBy.value = 'created_at'
      await nextTick()

      // The mock filterAndSortTemplates should be called with new sort option
      expect(composable.filteredAndSortedOwnedTemplates.value).toBeDefined()
      expect(composable.filteredAndSortedSharedTemplates.value).toBeDefined()
    })
  })

  describe('navigation functions', () => {
    it('should navigate to new template page', () => {
      const composable = useExpenseTemplates()

      composable.goToNewTemplate()

      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'new-template' })
    })

    it('should navigate to template detail page', () => {
      const composable = useExpenseTemplates()
      const templateId = 'template123'

      composable.viewTemplate(templateId)

      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'template',
        params: { id: templateId },
      })
    })
  })

  describe('deleteTemplate', () => {
    it('should show confirmation dialog with correct template name', () => {
      const composable = useExpenseTemplates()
      const template = mockTemplates[0] as ExpenseTemplateWithPermission

      composable.deleteTemplate(template)

      expect(mockDialog).toHaveBeenCalledWith({
        title: 'Delete Template',
        message: `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
        persistent: true,
        ok: {
          label: 'Delete',
          color: 'negative',
          unelevated: true,
        },
        cancel: {
          label: 'Cancel',
          flat: true,
        },
      })
    })

    it('should delete template and show success notification when confirmed', () => {
      const mockOnOk = vi.fn()
      mockDialog.mockReturnValue({ onOk: mockOnOk })

      const composable = useExpenseTemplates()
      const template = mockTemplates[0] as ExpenseTemplateWithPermission

      composable.deleteTemplate(template)

      // Simulate user clicking OK
      const onOkCallback = mockOnOk.mock.calls[0]?.[0]
      expect(onOkCallback).toBeDefined()

      if (onOkCallback) {
        onOkCallback()

        expect(templatesStore.removeTemplate).toHaveBeenCalledWith(template.id)
        expect(notificationStore.showSuccess).toHaveBeenCalledWith('Template deleted successfully')
      }
    })

    it('should not delete template when dialog is cancelled', () => {
      const mockOnOk = vi.fn()
      mockDialog.mockReturnValue({ onOk: mockOnOk })

      const composable = useExpenseTemplates()
      const template = mockTemplates[0] as ExpenseTemplateWithPermission

      composable.deleteTemplate(template)

      // Don't call the onOk callback (simulate cancel)
      expect(templatesStore.removeTemplate).not.toHaveBeenCalled()
      expect(notificationStore.showSuccess).not.toHaveBeenCalled()
    })
  })

  describe('reactive updates', () => {
    it('should react to store state changes', async () => {
      const composable = useExpenseTemplates()

      expect(composable.areTemplatesLoading.value).toBe(false)

      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])
      await nextTick()

      expect(composable.areTemplatesLoading.value).toBe(true)
    })

    it('should react to templates changes', async () => {
      // Start with no templates to test the change
      // @ts-expect-error - Testing Pinia
      templatesStore.ownedTemplates = ref([])
      // @ts-expect-error - Testing Pinia
      templatesStore.sharedTemplates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.hasTemplates.value).toBe(false)

      const newTemplate: ExpenseTemplateWithPermission = {
        id: 'new-template',
        name: 'New Template',
        currency: 'USD',
        duration: 'monthly',
        total: 75,
        owner_id: 'user1',
        created_at: '2024-01-04',
        updated_at: '2024-01-04',
        permission_level: 'edit',
        is_shared: false,
      }

      // @ts-expect-error - Testing Pinia
      templatesStore.ownedTemplates = ref([newTemplate])
      await nextTick()

      expect(composable.hasTemplates.value).toBe(true)
    })
  })

  describe('return object', () => {
    it('should return all expected properties and methods', () => {
      const composable = useExpenseTemplates()

      expect(composable).toHaveProperty('searchQuery')
      expect(composable).toHaveProperty('sortBy')
      expect(composable).toHaveProperty('areTemplatesLoading')
      expect(composable).toHaveProperty('filteredAndSortedOwnedTemplates')
      expect(composable).toHaveProperty('filteredAndSortedSharedTemplates')
      expect(composable).toHaveProperty('hasTemplates')
      expect(composable).toHaveProperty('goToNewTemplate')
      expect(composable).toHaveProperty('viewTemplate')
      expect(composable).toHaveProperty('deleteTemplate')

      expect(typeof composable.goToNewTemplate).toBe('function')
      expect(typeof composable.viewTemplate).toBe('function')
      expect(typeof composable.deleteTemplate).toBe('function')
    })
  })
})
