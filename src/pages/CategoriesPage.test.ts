import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach, describe } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref, computed } from 'vue'
import CategoriesPage from './CategoriesPage.vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { CategoryWithStats } from 'src/api'

installQuasarPlugin()

const mockCategories: CategoryWithStats[] = [
  {
    id: 'cat-1',
    name: 'Rent/Mortgage',
    color: '#1d4ed8',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    templates: [],
  },
  {
    id: 'cat-2',
    name: 'Groceries',
    color: '#22c55e',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
    templates: [],
  },
  {
    id: 'cat-3',
    name: 'Entertainment',
    color: '#e879f9',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
    templates: [],
  },
]

function createWrapper(
  initialState: { categories?: CategoryWithStats[]; isLoading?: boolean } = {},
) {
  const wrapper = mount(CategoriesPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            categories: {
              categories: [],
              isLoading: false,
              ...initialState,
            },
          },
        }),
      ],
      stubs: {
        QBtn: {
          template:
            '<button class="q-btn" @click="$emit(\'click\')" :loading="loading" :data-loading="loading">{{ label }}<slot /></button>',
          props: [
            'loading',
            'color',
            'icon',
            'label',
            'unelevated',
            'flat',
            'round',
            'dense',
            'size',
          ],
          emits: ['click'],
        },
        QCard: {
          template: '<div class="q-card category-card" :class="$attrs.class"><slot /></div>',
          inheritAttrs: false,
        },
        QCardSection: {
          template: '<div class="q-card-section"><slot /></div>',
        },
        QInput: {
          template:
            '<div class="q-input"><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :placeholder="placeholder" /></div>',
          props: ['modelValue', 'placeholder', 'outlined', 'dense'],
          emits: ['update:modelValue'],
        },
        QSkeleton: {
          template:
            '<div class="q-skeleton" :data-type="type" :data-size="size" :data-width="width" :data-height="height"></div>',
          props: ['type', 'size', 'width', 'height'],
        },
        QAvatar: {
          template: '<div class="q-avatar" :style="style" :data-size="size"><slot /></div>',
          props: ['style', 'size'],
        },
        QIcon: {
          template: '<i class="q-icon" :data-name="name" :data-size="size"></i>',
          props: ['name', 'size'],
        },
      },
    },
  })

  const categoriesStore = useCategoriesStore()

  if (initialState.categories) {
    // @ts-expect-error - Testing Pinia
    categoriesStore.categories = ref(initialState.categories)
    // @ts-expect-error - Testing Pinia
    categoriesStore.categoryCount = computed(() => initialState.categories?.length || 0)
    // @ts-expect-error - Testing Pinia
    categoriesStore.sortedCategories = computed(() =>
      (initialState.categories || []).sort((a: CategoryWithStats, b: CategoryWithStats) =>
        a.name.localeCompare(b.name),
      ),
    )
  }
  if (initialState.isLoading !== undefined) {
    // @ts-expect-error - Testing Pinia
    categoriesStore.isLoading = ref(initialState.isLoading)
  }

  return { wrapper, categoriesStore }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CategoriesPage', () => {
  it('should mount component properly', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should render updated page title and description', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).toContain('Categories')
    expect(wrapper.text()).toContain('Standard categories available for all expense tracking')
  })

  it('should not render add category button (read-only)', () => {
    const { wrapper } = createWrapper()

    // Should not have Add Category button anymore
    expect(wrapper.text()).not.toContain('Add Category')
  })

  it('should render search input', () => {
    const { wrapper } = createWrapper()

    const searchInput = wrapper.find('.q-input')
    expect(searchInput.exists()).toBe(true)
  })

  it('should call loadCategories on mount', () => {
    const { categoriesStore } = createWrapper()
    expect(categoriesStore.loadCategories).toHaveBeenCalledOnce()
  })

  it('should show loading skeleton when loading and no categories', () => {
    const { wrapper } = createWrapper({
      isLoading: true,
      categories: [],
    })

    const skeletons = wrapper.findAll('.q-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show categories in card grid when categories exist', () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Should render category cards (includes extra card for the preview dialog)
    const categoryCards = wrapper.findAll('.category-card')
    expect(categoryCards.length).toBeGreaterThanOrEqual(3)
  })

  it('should show empty state for search when no results', async () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Simulate search with no results by setting search query
    const searchInput = wrapper.find('.q-input input')
    await searchInput.setValue('nonexistent')
    await wrapper.vm.$nextTick()

    // Should show empty search state
    expect(wrapper.text()).toContain('No categories found')
    expect(wrapper.text()).toContain('Try adjusting your search terms')
  })

  it('should filter categories based on search query', async () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Search for "Rent"
    const searchInput = wrapper.find('.q-input input')
    await searchInput.setValue('Rent')
    await wrapper.vm.$nextTick()

    // Should filter the results - check the actual rendered cards
    const categoryCards = wrapper.findAll('.category-card')
    expect(categoryCards.length).toBeLessThan(mockCategories.length)
    expect(wrapper.text()).toContain('Rent/Mortgage')
    expect(wrapper.text()).not.toContain('Groceries')
    expect(wrapper.text()).not.toContain('Entertainment')
  })

  it('should display category information in cards', () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Should show category names
    expect(wrapper.text()).toContain('Rent/Mortgage')
    expect(wrapper.text()).toContain('Groceries')
    expect(wrapper.text()).toContain('Entertainment')

    // Should show template counts
    expect(wrapper.text()).toContain('0 templates')
  })

  it('should have proper responsive grid structure', () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Should have grid layout
    expect(wrapper.find('.row.q-col-gutter-md').exists()).toBe(true)
  })

  it('should show search functionality', () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    const searchInput = wrapper.find('.q-input')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.find('input').attributes('placeholder')).toBe('Search categories...')
  })

  it('should not show CRUD functionality', () => {
    const { wrapper } = createWrapper({
      categories: mockCategories,
    })

    // Should not have edit or delete buttons
    expect(wrapper.text()).not.toContain('Edit')
    expect(wrapper.text()).not.toContain('Delete')
    expect(wrapper.text()).not.toContain('Create')
  })
})
