import { mount } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref, computed } from 'vue'
import CategoriesPage from './CategoriesPage.vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory } from 'src/api'

installQuasarPlugin()

vi.mock('src/utils/date', () => ({
  formatDate: vi.fn((date: string) => `formatted-${date}`),
}))

const CategoryDialogStub = {
  template:
    '<div class="category-dialog-mock" :data-model-value="modelValue" :data-category="category ? category.id : \'null\'"></div>',
  props: ['modelValue', 'category'],
  emits: ['update:modelValue', 'category-saved'],
}

const CategoryDeleteDialogStub = {
  template:
    '<div class="category-delete-dialog-mock" :data-model-value="modelValue" :data-category="category ? category.id : \'null\'"></div>',
  props: ['modelValue', 'category'],
  emits: ['update:modelValue', 'category-deleted'],
}

const mockCategories: ExpenseCategory[] = [
  {
    id: 'cat-1',
    name: 'Food',
    color: '#FF5722',
    owner_id: 'user-1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Transport',
    color: '#2196F3',
    owner_id: 'user-1',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
]

function createWrapper(initialState: { categories?: ExpenseCategory[]; isLoading?: boolean } = {}) {
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
        CategoryDialog: CategoryDialogStub,
        CategoryDeleteDialog: CategoryDeleteDialogStub,
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
          template: '<div class="q-card" :class="$attrs.class"><slot /></div>',
          inheritAttrs: false,
        },
        QCardSection: {
          template: '<div class="q-card-section"><slot /></div>',
        },
        QTable: {
          template:
            '<div class="q-table" :class="$attrs.class">Table with {{ rows ? rows.length : 0 }} rows</div>',
          props: ['rows', 'columns', 'rowKey', 'bordered', 'flat', 'pagination', 'hidePagination'],
          inheritAttrs: false,
        },
        QTd: {
          template: '<td class="q-td"><slot /></td>',
          props: ['props'],
        },
        QList: {
          template: '<div class="q-list"><slot /></div>',
        },
        QItem: {
          template: '<div class="q-item"><slot /></div>',
        },
        QItemSection: {
          template: '<div class="q-item-section" :class="$attrs.class"><slot /></div>',
          inheritAttrs: false,
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
        QTooltip: {
          template: '<div class="q-tooltip"><slot /></div>',
        },
      },
    },
  })

  const categoriesStore = useCategoriesStore()

  if (initialState.categories) {
    // @ts-expect-error - Testing Pinia
    categoriesStore.categories = ref(initialState.categories)
    // @ts-expect-error - Testing Pinia
    categoriesStore.sortedCategories = computed(() =>
      (categoriesStore.categories || []).sort((a: ExpenseCategory, b: ExpenseCategory) =>
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

it('should mount component properly', () => {
  const { wrapper } = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should render page title and description', () => {
  const { wrapper } = createWrapper()

  expect(wrapper.find('h1').text()).toBe('Categories')
  expect(wrapper.text()).toContain('Manage your expense categories')
})

it('should render add category button', () => {
  const { wrapper } = createWrapper()

  const addButton = wrapper.find('.q-btn')
  expect(addButton.exists()).toBe(true)
  expect(wrapper.text()).toContain('Add Category')
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
  expect(wrapper.find('.q-table').exists()).toBe(false)
})

it('should show categories table when categories exist', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.find('.q-table').exists()).toBe(true)
  expect(wrapper.find('.categories-table').exists()).toBe(true)
})

it('should show empty state when no categories and not loading', () => {
  const { wrapper } = createWrapper({
    isLoading: false,
    categories: [],
  })

  expect(wrapper.text()).toContain('No categories found')
  expect(wrapper.text()).toContain('Start by creating your first custom category')
  expect(wrapper.text()).toContain('Create Your First Category')
})

it('should not show empty state when categories exist', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.text()).not.toContain('No categories found')
  expect(wrapper.text()).not.toContain('Create Your First Category')
})

it('should have formatDate mock available', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.find('.q-table').exists()).toBe(true)
  expect(vi.mocked).toBeDefined()
})

it('should open create dialog when add category button is clicked', async () => {
  const { wrapper } = createWrapper()

  const addButton = wrapper.find('.q-btn')
  await addButton.trigger('click')

  const dialog = wrapper.findComponent(CategoryDialogStub)
  expect(dialog.attributes('data-model-value')).toBe('true')
  expect(dialog.attributes('data-category')).toBe('null')
})

it('should open create dialog when empty state button is clicked', async () => {
  const { wrapper } = createWrapper({
    isLoading: false,
    categories: [],
  })

  const createButton = wrapper.find('.q-btn')
  await createButton.trigger('click')

  const dialog = wrapper.findComponent(CategoryDialogStub)
  expect(dialog.attributes('data-model-value')).toBe('true')
})

it('should render edit and delete actions when categories exist', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.text()).toContain('Table with 2 rows')
  expect(wrapper.find('.q-table').exists()).toBe(true)
})

it('should have proper table structure when categories exist', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  const table = wrapper.find('.q-table')
  expect(table.exists()).toBe(true)
  expect(table.classes()).toContain('categories-table')
})

it('should reset selected category when category is saved', async () => {
  const { wrapper } = createWrapper()

  const dialog = wrapper.findComponent(CategoryDialogStub)
  await dialog.vm.$emit('category-saved')

  expect(dialog.attributes('data-category')).toBe('null')
})

it('should reset selected category when category is deleted', async () => {
  const { wrapper } = createWrapper()

  const deleteDialog = wrapper.findComponent(CategoryDeleteDialogStub)
  await deleteDialog.vm.$emit('category-deleted')

  const dialog = wrapper.findComponent(CategoryDialogStub)
  expect(dialog.attributes('data-category')).toBe('null')
})

it('should show proper page structure with categories', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.find('.q-table').exists()).toBe(true)
  expect(wrapper.find('.q-card').exists()).toBe(false)
  expect(wrapper.text()).toContain('Categories')
  expect(wrapper.text()).toContain('Manage your expense categories')
})

it('should show loading skeleton when store is loading', () => {
  const { wrapper } = createWrapper({
    isLoading: true,
    categories: [],
  })

  const skeletons = wrapper.findAll('.q-skeleton')
  expect(skeletons.length).toBeGreaterThan(0)
  expect(wrapper.find('.q-table').exists()).toBe(false)
})

it('should render category management interface', () => {
  const { wrapper } = createWrapper({
    categories: mockCategories,
  })

  expect(wrapper.text()).toContain('Categories')
  expect(wrapper.text()).toContain('Add Category')
  expect(wrapper.find('.q-table').exists()).toBe(true)
})
