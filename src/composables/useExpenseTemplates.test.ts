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

const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('quasar', () => ({
  Dark: {
    set: vi.fn(),
  },
  Notify: {
    create: vi.fn(),
  },
  Quasar: {},
}))

vi.mock('src/utils/list-filters', () => ({
  filterAndSortTemplates: vi.fn((templates, searchQuery, sortBy) => {
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

vi.mock('src/api', async () => {
  const actual = await vi.importActual('src/api')
  return {
    ...actual,
    deleteExpenseTemplate: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock('src/composables/useError', () => ({
  useError: () => ({
    handleError: vi.fn(),
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
    pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false })
    setActivePinia(pinia)

    templatesStore = useTemplatesStore()
    notificationStore = useNotificationStore()

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
    it('should compute areItemsLoading correctly when loading with no templates', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.areItemsLoading.value).toBe(true)
    })

    it('should compute areItemsLoading correctly when loading with existing templates', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref(mockTemplates)

      const composable = useExpenseTemplates()

      expect(composable.areItemsLoading.value).toBe(false)
    })

    it('should compute areItemsLoading correctly when not loading', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(false)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.areItemsLoading.value).toBe(false)
    })

    it('should filter and sort owned templates', () => {
      const composable = useExpenseTemplates()

      const expectedTemplates = mockTemplates
        .filter((t) => t.owner_id === 'user1')
        .sort((a, b) => a.name.localeCompare(b.name))

      expect(composable.filteredAndSortedOwnedItems.value).toEqual(expectedTemplates)
    })

    it('should filter and sort shared templates', () => {
      const composable = useExpenseTemplates()

      expect(composable.filteredAndSortedSharedItems.value).toEqual(
        mockTemplates.filter((t) => t.owner_id !== 'user1'),
      )
    })

    it('should compute hasTemplates correctly when templates exist', () => {
      const composable = useExpenseTemplates()

      expect(composable.hasItems.value).toBe(true)
    })

    it('should compute hasTemplates correctly when no templates exist', () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.ownedTemplates = ref([])
      // @ts-expect-error - Testing Pinia
      templatesStore.sharedTemplates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.hasItems.value).toBe(false)
    })
  })

  describe('search and filter functionality', () => {
    it('should update filtered templates when search query changes', async () => {
      const composable = useExpenseTemplates()

      composable.searchQuery.value = 'grocery'
      await nextTick()

      expect(composable.filteredAndSortedOwnedItems.value).toBeDefined()
      expect(composable.filteredAndSortedSharedItems.value).toBeDefined()
    })

    it('should update filtered templates when sort option changes', async () => {
      const composable = useExpenseTemplates()

      composable.sortBy.value = 'created_at'
      await nextTick()

      expect(composable.filteredAndSortedOwnedItems.value).toBeDefined()
      expect(composable.filteredAndSortedSharedItems.value).toBeDefined()
    })
  })

  describe('navigation functions', () => {
    it('should navigate to new template page', () => {
      const composable = useExpenseTemplates()

      composable.goToNew()

      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'new-template' })
    })

    it('should navigate to template detail page', () => {
      const composable = useExpenseTemplates()
      const templateId = 'template123'

      composable.viewItem(templateId)

      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'template',
        params: { id: templateId },
      })
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template and show success notification', () => {
      const composable = useExpenseTemplates()
      const template = mockTemplates[0] as ExpenseTemplateWithPermission
      const removeTemplateSpy = vi.spyOn(templatesStore, 'removeTemplate')

      composable.deleteItem(template)

      expect(removeTemplateSpy).toHaveBeenCalledWith(template.id)
    })
  })

  describe('reactive updates', () => {
    it('should react to store state changes', async () => {
      const composable = useExpenseTemplates()

      expect(composable.areItemsLoading.value).toBe(false)

      // @ts-expect-error - Testing Pinia
      templatesStore.isLoading = ref(true)
      // @ts-expect-error - Testing Pinia
      templatesStore.templates = ref([])
      await nextTick()

      expect(composable.areItemsLoading.value).toBe(true)
    })

    it('should react to templates changes', async () => {
      // @ts-expect-error - Testing Pinia
      templatesStore.ownedTemplates = ref([])
      // @ts-expect-error - Testing Pinia
      templatesStore.sharedTemplates = ref([])

      const composable = useExpenseTemplates()

      expect(composable.hasItems.value).toBe(false)

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

      expect(composable.hasItems.value).toBe(true)
    })
  })

  describe('return object', () => {
    it('should return all expected properties and methods', () => {
      const composable = useExpenseTemplates()

      expect(composable).toHaveProperty('searchQuery')
      expect(composable).toHaveProperty('sortBy')
      expect(composable).toHaveProperty('areItemsLoading')
      expect(composable).toHaveProperty('filteredAndSortedOwnedItems')
      expect(composable).toHaveProperty('filteredAndSortedSharedItems')
      expect(composable).toHaveProperty('hasItems')
      expect(composable).toHaveProperty('goToNew')
      expect(composable).toHaveProperty('viewItem')
      expect(composable).toHaveProperty('deleteItem')

      expect(typeof composable.goToNew).toBe('function')
      expect(typeof composable.viewItem).toBe('function')
      expect(typeof composable.deleteItem).toBe('function')
    })
  })
})
