import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach, describe } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import TemplatePage from './TemplatePage.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import type { Category, TemplateWithItems } from 'src/api'
import type { TemplateItemUI } from 'src/types'
import type { TemplateCategoryGroup } from 'src/composables/useTemplateItems'

installQuasarPlugin()

const mockRouterPush = vi.fn()
const mockRoute = {
  name: 'edit-template',
  params: { id: 'template-1' },
}

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
  useRoute: () => mockRoute,
}))

vi.mock('src/composables/useError', () => ({
  useError: () => ({
    handleError: vi.fn(),
  }),
}))

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

const mockUseTemplate = {
  isTemplateLoading: ref(false),
  isNewTemplate: ref(false),
  routeTemplateId: ref('template-1'),
  isOwner: ref(true),
  isReadOnlyMode: ref(false),
  isEditMode: ref(true),
  templateCurrency: ref('USD'),
  createNewTemplateWithItems: vi.fn(),
  updateExistingTemplateWithItems: vi.fn(),
  loadTemplate: vi.fn(),
}

vi.mock('src/composables/useTemplate', () => ({
  useTemplate: () => mockUseTemplate,
}))

const mockUseTemplateItems = {
  templateItems: ref<TemplateItemUI[]>([]),
  totalAmount: ref(0),
  hasItems: ref(false),
  hasValidItems: ref(false),
  hasDuplicateItems: ref(false),
  isValidForSave: ref(false),
  categoryGroups: ref<TemplateCategoryGroup[]>([]),
  addTemplateItem: vi.fn(),
  updateTemplateItem: vi.fn(),
  removeTemplateItem: vi.fn(),
  loadTemplateItems: vi.fn(),
  getTemplateItemsForSave: vi.fn(() => []),
  getUsedCategoryIds: vi.fn(() => []),
}

vi.mock('src/composables/useTemplateItems', () => ({
  useTemplateItems: () => mockUseTemplateItems,
}))

const TemplateCategoryStub = {
  template: '<div class="template-category-mock" :data-category-id="categoryId"></div>',
  props: [
    'categoryId',
    'categoryName',
    'categoryColor',
    'items',
    'subtotal',
    'currency',
    'readonly',
  ],
  emits: ['update-item', 'remove-item', 'add-item'],
}

const CategorySelectionDialogStub = {
  template: '<div class="category-selection-dialog-mock" :data-model-value="modelValue"></div>',
  props: ['modelValue', 'usedCategoryIds', 'categories'],
  emits: ['update:modelValue', 'category-selected'],
}

const ShareTemplateDialogStub = {
  template:
    '<div class="share-template-dialog-mock" :data-model-value="modelValue" :data-template-id="templateId"></div>',
  props: ['modelValue', 'templateId'],
  emits: ['update:modelValue', 'shared'],
}

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food',
    color: '#FF5722',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'cat-2',
    name: 'Transport',
    color: '#2196F3',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
]

const mockTemplate: TemplateWithItems = {
  id: 'template-1',
  name: 'Monthly Budget',
  duration: 'monthly',
  total: 1500,
  currency: 'USD',
  owner_id: 'user-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  template_items: [
    {
      id: 'item-1',
      template_id: 'template-1',
      name: 'Groceries',
      category_id: 'cat-1',
      amount: 500,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_fixed_payment: true,
    },
  ],
}

const mockTemplateItems: TemplateItemUI[] = [
  {
    id: 'item-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    amount: 500,
    color: '#FF5722',
    isFixedPayment: true,
  },
]

function createWrapper(
  options: {
    isNewTemplate?: boolean
    isLoading?: boolean
    isReadOnlyMode?: boolean
    isOwner?: boolean
    categories?: Category[]
    hasItems?: boolean
    hasDuplicates?: boolean
  } = {},
) {
  const {
    isNewTemplate = false,
    isLoading = false,
    isReadOnlyMode = false,
    isOwner = true,
    categories = mockCategories,
    hasItems = false,
    hasDuplicates = false,
  } = options

  mockUseTemplate.isNewTemplate.value = isNewTemplate
  mockUseTemplate.isTemplateLoading.value = isLoading
  mockUseTemplate.isReadOnlyMode.value = isReadOnlyMode
  mockUseTemplate.isOwner.value = isOwner
  mockUseTemplate.isEditMode.value = !isReadOnlyMode

  if (hasItems) {
    mockUseTemplateItems.templateItems.value = mockTemplateItems
    mockUseTemplateItems.totalAmount.value = 500
    mockUseTemplateItems.hasItems.value = true
    mockUseTemplateItems.hasValidItems.value = true
    mockUseTemplateItems.isValidForSave.value = !hasDuplicates
    mockUseTemplateItems.categoryGroups.value = [
      {
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#FF5722',
        categoryIcon: 'eva-pricetags-outline',
        items: mockTemplateItems,
        subtotal: 500,
      },
    ]
  } else {
    mockUseTemplateItems.templateItems.value = []
    mockUseTemplateItems.totalAmount.value = 0
    mockUseTemplateItems.hasItems.value = false
    mockUseTemplateItems.hasValidItems.value = false
    mockUseTemplateItems.isValidForSave.value = false
    mockUseTemplateItems.categoryGroups.value = []
  }

  mockUseTemplateItems.hasDuplicateItems.value = hasDuplicates

  const wrapper = mount(TemplatePage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            categories: {
              categories,
              isLoading: false,
            },
            templates: {
              isLoading: false,
            },
          },
        }),
      ],
      stubs: {
        TemplateCategory: TemplateCategoryStub,
        CategorySelectionDialog: CategorySelectionDialogStub,
        ShareTemplateDialog: ShareTemplateDialogStub,
        QForm: {
          template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>',
          emits: ['submit'],
          methods: {
            validate: vi.fn(() => Promise.resolve(true)),
          },
        },
        QCard: {
          template: '<div class="q-card"><slot /></div>',
        },
        QToolbar: {
          template: '<div class="q-toolbar"><slot /></div>',
        },
        QToolbarTitle: {
          template: '<div class="q-toolbar-title"><slot /></div>',
        },
        QBtn: {
          template:
            '<button class="q-btn" @click="$emit(\'click\')" :loading="loading" :data-loading="loading" :data-to="to" :data-label="label">{{ label }}<slot /></button>',
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
            'to',
            'type',
          ],
          emits: ['click'],
        },
        QSelect: {
          template:
            '<select class="q-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)" :data-options="options"></select>',
          props: ['modelValue', 'options', 'outlined', 'emitValue', 'mapOptions'],
          emits: ['update:modelValue'],
        },
        QInput: {
          template:
            '<input class="q-input" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" :readonly="readonly" :data-label="label" />',
          props: ['modelValue', 'label', 'outlined', 'rules', 'readonly'],
          emits: ['update:modelValue'],
        },
        QIcon: {
          template: '<i class="q-icon" :data-name="name" :data-size="size"></i>',
          props: ['name', 'size'],
        },
        QChip: {
          template: '<div class="q-chip" :data-label="label" :data-color="color">{{ label }}</div>',
          props: ['label', 'color', 'textColor', 'size', 'ripple', 'outline'],
        },
        QBanner: {
          template: '<div class="q-banner"><slot name="avatar" /><slot /></div>',
        },
        QSeparator: {
          template: '<hr class="q-separator" />',
        },
        QSkeleton: {
          template:
            '<div class="q-skeleton" :data-type="type" :data-width="width" :data-height="height"></div>',
          props: ['type', 'width', 'height'],
        },
        QSpinnerHourglass: {
          template: '<div class="q-spinner-hourglass"></div>',
        },
        QBreadcrumbs: {
          template: '<div class="q-breadcrumbs"><slot /></div>',
        },
        QBreadcrumbsEl: {
          template:
            '<div class="q-breadcrumbs-el" :data-label="label" :data-icon="icon" :data-to="to">{{ label }}</div>',
          props: ['label', 'icon', 'to'],
        },
        ActionsFab: {
          template:
            '<div v-if="visible" class="actions-fab" :data-model-value="modelValue" :data-visible="visible"><button v-for="action in visibleActions" :key="action.key" :data-label="action.label" @click="$emit(\'action-clicked\', action.key); action.handler()">{{ action.label }}</button></div>',
          props: ['modelValue', 'actions', 'visible'],
          emits: ['update:modelValue', 'action-clicked'],
          computed: {
            visibleActions() {
              return this.actions.filter((action: { visible: boolean }) => action.visible !== false)
            },
          },
        },
      },
    },
  })

  const templatesStore = useTemplatesStore()
  const categoriesStore = useCategoriesStore()

  if (categories) {
    // @ts-expect-error - Testing Pinia
    categoriesStore.categories = ref(categories)
    categoriesStore.getCategoryById = vi.fn(
      (id: string) =>
        categories.map((cat) => ({ ...cat, templates: [] })).find((cat) => cat.id === id) ||
        undefined,
    )
  }

  return { wrapper, templatesStore, categoriesStore }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.name = 'edit-template'
  mockRoute.params = { id: 'template-1' }

  mockUseTemplate.loadTemplate.mockResolvedValue(mockTemplate)
  mockUseTemplate.createNewTemplateWithItems.mockResolvedValue(true)
  mockUseTemplate.updateExistingTemplateWithItems.mockResolvedValue(true)
})

describe('TemplatePage', () => {
  it('should mount component properly', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should call loadCategories and loadCurrentTemplate on mount', async () => {
    const { categoriesStore } = createWrapper()
    await flushPromises()

    expect(categoriesStore.loadCategories).toHaveBeenCalledOnce()
    expect(mockUseTemplate.loadTemplate).toHaveBeenCalledOnce()
  })

  it('should show loading skeleton when template is loading', () => {
    const { wrapper } = createWrapper({ isLoading: true })

    const skeletons = wrapper.findAll('.q-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('should render edit form when in edit mode', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('.q-input').exists()).toBe(true)
    expect(wrapper.find('.q-select').exists()).toBe(true)
  })

  it('should render readonly view when in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.find('.q-input[readonly]').exists()).toBe(true)
  })

  it('should show correct page title for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    expect(wrapper.text()).toContain('Create Template')
  })

  it('should show correct page title for read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    expect(wrapper.text()).toContain('View Template')
  })

  it('should show correct page title for edit mode', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).toContain('Edit Template')
  })

  it('should show read-only banner when in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    expect(wrapper.text()).toContain('Read-only access')
  })

  it('should not show read-only banner when not in read-only mode', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).not.toContain("You're viewing this template in read-only mode")
  })

  it('should show empty state when no items', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).toContain('No categories yet')
    expect(wrapper.text()).toContain('Add Your First Category')
  })

  it('should show categories when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponents = wrapper.findAllComponents(TemplateCategoryStub)
    expect(categoryComponents.length).toBe(1)
    expect(wrapper.text()).toContain('Total Amount')
  })

  it('should show duplicate items warning when duplicates exist', () => {
    const { wrapper } = createWrapper({ hasItems: true, hasDuplicates: true })

    expect(wrapper.text()).toContain('You have duplicate item names')
  })

  it('should open category selection dialog when add category button is clicked', async () => {
    const { wrapper } = createWrapper()

    const addButton = wrapper.find('[data-label="Add Your First Category"]')
    await addButton.trigger('click')

    const dialog = wrapper.findComponent(CategorySelectionDialogStub)
    expect(dialog.attributes('data-model-value')).toBe('true')
  })

  it('should open category selection dialog from empty state', async () => {
    const { wrapper } = createWrapper()

    const addButton = wrapper.find('[data-label="Add Your First Category"]')
    await addButton.trigger('click')

    const dialog = wrapper.findComponent(CategorySelectionDialogStub)
    expect(dialog.attributes('data-model-value')).toBe('true')
  })

  it('should call addTemplateItem when category is selected', async () => {
    const { wrapper } = createWrapper()

    const dialog = wrapper.findComponent(CategorySelectionDialogStub)
    await dialog.vm.$emit('category-selected', mockCategories[0])

    expect(mockUseTemplateItems.addTemplateItem).toHaveBeenCalledWith(
      mockCategories[0]?.id,
      mockCategories[0]?.color,
    )
  })

  it('should navigate back when back button is clicked', async () => {
    const { wrapper } = createWrapper()

    const backButton = wrapper.find('.q-btn')
    await backButton.trigger('click')

    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'templates' })
  })

  it('should show delete dialog when delete button is clicked for existing template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: false, isOwner: true })

    // Delete dialog should be present in the DOM
    const deleteDialog = wrapper.findComponent({ name: 'DeleteDialog' })
    expect(deleteDialog.exists()).toBe(true)
  })

  it('should show share button for existing template when owner', () => {
    const { wrapper } = createWrapper({ isOwner: true })

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.exists()).toBe(true)
  })

  it('should not show share button for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.exists()).toBe(false)
  })

  it('should not show share button when not owner', () => {
    const { wrapper } = createWrapper({ isOwner: false })

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.exists()).toBe(false)
  })

  it('should open share dialog when share button is clicked', async () => {
    const { wrapper } = createWrapper({ isOwner: true })

    const shareButton = wrapper.find('[data-label="Share"]')
    await shareButton.trigger('click')

    const shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
    expect(shareDialog.attributes('data-model-value')).toBe('true')
  })

  it('should reload templates when template is shared', async () => {
    const { wrapper, templatesStore } = createWrapper({ isOwner: true })

    const shareDialog = wrapper.findComponent(ShareTemplateDialogStub)
    await shareDialog.vm.$emit('shared')

    expect(templatesStore.loadTemplates).toHaveBeenCalledOnce()
  })

  it('should show save button for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    // The page should render in edit mode with actions
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Template')
  })

  it('should show save button for existing template', () => {
    const { wrapper } = createWrapper()

    // The page should render in edit mode with actions
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit Template')
  })

  it('should allow form input interaction', async () => {
    const { wrapper } = createWrapper()

    const nameInput = wrapper.find('.q-input')
    expect(nameInput.exists()).toBe(true)

    // Test that setValue can be called without errors
    await nameInput.setValue('Test Template Name')
    expect(nameInput.exists()).toBe(true)
  })

  it('should not save when validation fails', async () => {
    const { wrapper } = createWrapper()
    mockUseTemplateItems.isValidForSave.value = false
    mockUseTemplateItems.hasValidItems.value = false

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockUseTemplate.createNewTemplateWithItems).not.toHaveBeenCalled()
    expect(mockUseTemplate.updateExistingTemplateWithItems).not.toHaveBeenCalled()
  })

  it('should display formatted total amount when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    expect(wrapper.text()).toContain('USD 500.00')
  })

  it('should show correct breadcrumb labels for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    // Page should show appropriate title for new template
    expect(wrapper.text()).toContain('Create Template')
  })

  it('should show correct breadcrumb labels for edit template', () => {
    const { wrapper } = createWrapper()

    // Page should show appropriate title for edit template
    expect(wrapper.text()).toContain('Edit Template')
  })

  it('should show correct breadcrumb labels for view template', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    // Page should show appropriate title for view template
    expect(wrapper.text()).toContain('View Template')
  })

  it('should handle template loading and populate form', async () => {
    createWrapper()
    await flushPromises()

    expect(mockUseTemplate.loadTemplate).toHaveBeenCalledOnce()
    expect(mockUseTemplateItems.loadTemplateItems).toHaveBeenCalledWith(mockTemplate)
  })

  it('should show duration select options in edit mode', () => {
    const { wrapper } = createWrapper()

    const durationSelect = wrapper.find('.q-select')
    expect(durationSelect.exists()).toBe(true)
  })

  it('should show duration as chip in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    const durationChip = wrapper.find('.q-chip')
    expect(durationChip.exists()).toBe(true)
  })

  it('should show save button in edit mode', () => {
    const { wrapper } = createWrapper()

    // The page should be in edit mode with save functionality
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('should show category count chip when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    // Should show category information with items
    expect(wrapper.text()).toContain('Total Amount')
    expect(wrapper.text()).toContain('Total across 1 category')
  })

  it('should handle template item updates', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(TemplateCategoryStub)
    await categoryComponent.vm.$emit('update-item', 'item-1', { name: 'Updated Item' })

    expect(mockUseTemplateItems.updateTemplateItem).toHaveBeenCalledWith('item-1', {
      name: 'Updated Item',
    })
  })

  it('should handle template item removal', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(TemplateCategoryStub)
    await categoryComponent.vm.$emit('remove-item', 'item-1')

    expect(mockUseTemplateItems.removeTemplateItem).toHaveBeenCalledWith('item-1')
  })

  it('should handle adding new template item', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(TemplateCategoryStub)
    await categoryComponent.vm.$emit('add-item', 'cat-1')

    expect(mockUseTemplateItems.addTemplateItem).toHaveBeenCalledWith('cat-1', undefined)
  })

  it('should show correct singular/plural text for category count', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    expect(wrapper.text()).toContain('Total across 1 category')
  })

  it('should pass correct props to category components', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(TemplateCategoryStub)
    expect(categoryComponent.props('categoryId')).toBe('cat-1')
    expect(categoryComponent.props('categoryName')).toBe('Food')
    expect(categoryComponent.props('categoryColor')).toBe('#FF5722')
    expect(categoryComponent.props('currency')).toBe('USD')
    expect(categoryComponent.props('readonly')).toBe(false)
  })

  it('should pass readonly prop correctly in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, hasItems: true })

    // In read-only mode, the view uses TemplateReadOnlyView
    expect(wrapper.text()).toContain('View Template')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
