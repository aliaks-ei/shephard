import { nextTick, ref, computed } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'

import { useTemplates } from './useTemplates'
import type { TemplateWithPermission } from 'src/api'
import { createMockTemplates } from 'test/fixtures'

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
      filtered = templates.filter((t: TemplateWithPermission) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }
    return filtered.sort((a: TemplateWithPermission, b: TemplateWithPermission) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }),
}))

vi.mock('src/composables/useError', () => ({
  useError: () => ({
    handleError: vi.fn(),
  }),
}))

vi.mock('src/composables/useNotificationEvents', () => ({
  useNotificationEvents: () => ({
    emitNotificationEvent: vi.fn().mockResolvedValue(true),
    emitRemovalNotification: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('src/api', async () => {
  const actual = await vi.importActual<object>('src/api')
  return {
    ...actual,
    getTemplateSharedUsers: vi.fn().mockResolvedValue([]),
  }
})

const mockTemplates = createMockTemplates(3)
const mockTemplatesRef = ref<TemplateWithPermission[]>([
  ...mockTemplates,
] as TemplateWithPermission[])
const mockIsPending = ref(false)
const mockDeleteMutateAsync = vi.fn().mockResolvedValue(undefined)

vi.mock('src/queries/templates', () => ({
  useTemplatesQuery: vi.fn(() => ({
    templates: mockTemplatesRef,
    isPending: mockIsPending,
    templatesCount: computed(() => mockTemplatesRef.value.length),
    data: ref(null),
  })),
  useDeleteTemplateMutation: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: ref(false),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1' },
  })),
}))

describe('useTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTemplatesRef.value = [...mockTemplates] as TemplateWithPermission[]
    mockIsPending.value = false
  })

  it('should initialize with default state', () => {
    const composable = useTemplates()

    expect(composable.searchQuery.value).toBe('')
    expect(composable.sortBy.value).toBe('name')
  })

  describe('computed properties', () => {
    it('should compute areItemsLoading correctly when loading with no templates', () => {
      mockIsPending.value = true
      mockTemplatesRef.value = []

      const composable = useTemplates()

      expect(composable.areItemsLoading.value).toBe(true)
    })

    it('should compute areItemsLoading correctly when loading with existing templates', () => {
      mockIsPending.value = true
      mockTemplatesRef.value = [...mockTemplates] as TemplateWithPermission[]

      const composable = useTemplates()

      expect(composable.areItemsLoading.value).toBe(false)
    })

    it('should compute areItemsLoading correctly when not loading', () => {
      mockIsPending.value = false
      mockTemplatesRef.value = []

      const composable = useTemplates()

      expect(composable.areItemsLoading.value).toBe(false)
    })

    it('should filter and sort all templates', () => {
      const composable = useTemplates()

      const expectedTemplates = [...mockTemplates].sort((a, b) => a.name.localeCompare(b.name))

      expect(composable.allFilteredAndSortedItems.value).toEqual(expectedTemplates)
    })

    it('should compute hasTemplates correctly when templates exist', () => {
      const composable = useTemplates()

      expect(composable.hasItems.value).toBe(true)
    })

    it('should compute hasTemplates correctly when no templates exist', () => {
      mockTemplatesRef.value = []

      const composable = useTemplates()

      expect(composable.hasItems.value).toBe(false)
    })
  })

  describe('search and filter functionality', () => {
    it('should update filtered templates when search query changes', async () => {
      const composable = useTemplates()

      composable.searchQuery.value = 'grocery'
      await nextTick()

      expect(composable.allFilteredAndSortedItems.value).toBeDefined()
    })

    it('should update filtered templates when sort option changes', async () => {
      const composable = useTemplates()

      composable.sortBy.value = 'created_at'
      await nextTick()

      expect(composable.allFilteredAndSortedItems.value).toBeDefined()
    })
  })

  describe('navigation functions', () => {
    it('should navigate to new template page', () => {
      const composable = useTemplates()

      composable.goToNew()

      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'new-template' })
    })

    it('should navigate to template detail page', () => {
      const composable = useTemplates()
      const templateId = 'template123'

      composable.viewItem(templateId)

      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'template',
        params: { id: templateId },
      })
    })
  })

  describe('deleteTemplate', () => {
    it('should delete template via mutation', async () => {
      const composable = useTemplates()
      const template = mockTemplates[0] as TemplateWithPermission

      await composable.deleteItem(template)

      expect(mockDeleteMutateAsync).toHaveBeenCalledWith(template.id)
    })
  })

  describe('reactive updates', () => {
    it('should react to loading state changes', async () => {
      const composable = useTemplates()

      expect(composable.areItemsLoading.value).toBe(false)

      mockIsPending.value = true
      mockTemplatesRef.value = []
      await nextTick()

      expect(composable.areItemsLoading.value).toBe(true)
    })

    it('should react to templates changes', async () => {
      mockTemplatesRef.value = []

      const composable = useTemplates()

      expect(composable.hasItems.value).toBe(false)

      const newTemplate = createMockTemplates(1)[0]

      mockTemplatesRef.value = [newTemplate as TemplateWithPermission]
      await nextTick()

      expect(composable.hasItems.value).toBe(true)
    })
  })

  describe('return object', () => {
    it('should return all expected properties and methods', () => {
      const composable = useTemplates()

      expect(composable).toHaveProperty('searchQuery')
      expect(composable).toHaveProperty('sortBy')
      expect(composable).toHaveProperty('areItemsLoading')
      expect(composable).toHaveProperty('allFilteredAndSortedItems')
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
