import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach, describe } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import TemplatePage from './TemplatePage.vue'
import { useTemplatesStore } from 'src/stores/templates'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory, ExpenseTemplateWithItems } from 'src/api'
import type { ExpenseTemplateItemUI } from 'src/types'
import type { ExpenseCategoryGroup } from 'src/composables/useExpenseTemplateItems'

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

const mockUseExpenseTemplate = {
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

vi.mock('src/composables/useExpenseTemplate', () => ({
  useExpenseTemplate: () => mockUseExpenseTemplate,
}))

const mockUseExpenseTemplateItems = {
  expenseTemplateItems: ref<ExpenseTemplateItemUI[]>([]),
  totalAmount: ref(0),
  hasValidItems: ref(false),
  hasDuplicateItems: ref(false),
  isValidForSave: ref(false),
  expenseCategoryGroups: ref<ExpenseCategoryGroup[]>([]),
  addExpenseTemplateItem: vi.fn(),
  updateExpenseTemplateItem: vi.fn(),
  removeExpenseTemplateItem: vi.fn(),
  loadExpenseTemplateItems: vi.fn(),
  getExpenseTemplateItemsForSave: vi.fn(() => []),
  getUsedCategoryIds: vi.fn(() => []),
}

vi.mock('src/composables/useExpenseTemplateItems', () => ({
  useExpenseTemplateItems: () => mockUseExpenseTemplateItems,
}))

const ExpenseTemplateCategoryStub = {
  template: '<div class="expense-template-category-mock" :data-category-id="categoryId"></div>',
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

const ExpenseCategorySelectionDialogStub = {
  template:
    '<div class="expense-category-selection-dialog-mock" :data-model-value="modelValue"></div>',
  props: ['modelValue', 'usedCategoryIds', 'categories'],
  emits: ['update:modelValue', 'category-selected'],
}

const ShareExpenseTemplateDialogStub = {
  template:
    '<div class="share-expense-template-dialog-mock" :data-model-value="modelValue" :data-template-id="templateId"></div>',
  props: ['modelValue', 'templateId'],
  emits: ['update:modelValue', 'shared'],
}

const mockCategories: ExpenseCategory[] = [
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

const mockTemplate: ExpenseTemplateWithItems = {
  id: 'template-1',
  name: 'Monthly Budget',
  duration: 'monthly',
  total: 1500,
  currency: 'USD',
  owner_id: 'user-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  expense_template_items: [
    {
      id: 'item-1',
      template_id: 'template-1',
      name: 'Groceries',
      category_id: 'cat-1',
      amount: 500,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ],
}

const mockExpenseTemplateItems: ExpenseTemplateItemUI[] = [
  {
    id: 'item-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    amount: 500,
    color: '#FF5722',
  },
]

function createWrapper(
  options: {
    isNewTemplate?: boolean
    isLoading?: boolean
    isReadOnlyMode?: boolean
    isOwner?: boolean
    categories?: ExpenseCategory[]
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

  mockUseExpenseTemplate.isNewTemplate.value = isNewTemplate
  mockUseExpenseTemplate.isTemplateLoading.value = isLoading
  mockUseExpenseTemplate.isReadOnlyMode.value = isReadOnlyMode
  mockUseExpenseTemplate.isOwner.value = isOwner
  mockUseExpenseTemplate.isEditMode.value = !isReadOnlyMode

  if (hasItems) {
    mockUseExpenseTemplateItems.expenseTemplateItems.value = mockExpenseTemplateItems
    mockUseExpenseTemplateItems.totalAmount.value = 500
    mockUseExpenseTemplateItems.hasValidItems.value = true
    mockUseExpenseTemplateItems.isValidForSave.value = !hasDuplicates
    mockUseExpenseTemplateItems.expenseCategoryGroups.value = [
      {
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#FF5722',
        categoryIcon: 'eva-pricetags-outline',
        items: mockExpenseTemplateItems,
        subtotal: 500,
      },
    ]
  } else {
    mockUseExpenseTemplateItems.expenseTemplateItems.value = []
    mockUseExpenseTemplateItems.totalAmount.value = 0
    mockUseExpenseTemplateItems.hasValidItems.value = false
    mockUseExpenseTemplateItems.isValidForSave.value = false
    mockUseExpenseTemplateItems.expenseCategoryGroups.value = []
  }

  mockUseExpenseTemplateItems.hasDuplicateItems.value = hasDuplicates

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
        ExpenseTemplateCategory: ExpenseTemplateCategoryStub,
        ExpenseCategorySelectionDialog: ExpenseCategorySelectionDialogStub,
        ShareExpenseTemplateDialog: ShareExpenseTemplateDialogStub,
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
      (id: string) => categories.find((cat) => cat.id === id) || undefined,
    )
  }

  return { wrapper, templatesStore, categoriesStore }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.name = 'edit-template'
  mockRoute.params = { id: 'template-1' }

  mockUseExpenseTemplate.loadTemplate.mockResolvedValue(mockTemplate)
  mockUseExpenseTemplate.createNewTemplateWithItems.mockResolvedValue(true)
  mockUseExpenseTemplate.updateExistingTemplateWithItems.mockResolvedValue(true)
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
    expect(mockUseExpenseTemplate.loadTemplate).toHaveBeenCalledOnce()
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

    expect(wrapper.text()).toContain("You're viewing this template in read-only mode")
  })

  it('should not show read-only banner when not in read-only mode', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).not.toContain("You're viewing this template in read-only mode")
  })

  it('should show empty state when no expense items', () => {
    const { wrapper } = createWrapper()

    expect(wrapper.text()).toContain('No categories yet')
    expect(wrapper.text()).toContain('Add Your First Expense Category')
  })

  it('should show expense categories when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponents = wrapper.findAllComponents(ExpenseTemplateCategoryStub)
    expect(categoryComponents.length).toBe(1)
    expect(wrapper.text()).toContain('Total Amount')
  })

  it('should show duplicate items warning when duplicates exist', () => {
    const { wrapper } = createWrapper({ hasItems: true, hasDuplicates: true })

    expect(wrapper.text()).toContain('You have duplicate item names')
  })

  it('should open category selection dialog when add category button is clicked', async () => {
    const { wrapper } = createWrapper()

    const addButton = wrapper.find('[data-label="Add Category"]')
    await addButton.trigger('click')

    const dialog = wrapper.findComponent(ExpenseCategorySelectionDialogStub)
    expect(dialog.attributes('data-model-value')).toBe('true')
  })

  it('should open category selection dialog from empty state', async () => {
    const { wrapper } = createWrapper()

    const addButton = wrapper.find('[data-label="Add Your First Expense Category"]')
    await addButton.trigger('click')

    const dialog = wrapper.findComponent(ExpenseCategorySelectionDialogStub)
    expect(dialog.attributes('data-model-value')).toBe('true')
  })

  it('should call addExpenseTemplateItem when category is selected', async () => {
    const { wrapper } = createWrapper()

    const dialog = wrapper.findComponent(ExpenseCategorySelectionDialogStub)
    await dialog.vm.$emit('category-selected', mockCategories[0])

    expect(mockUseExpenseTemplateItems.addExpenseTemplateItem).toHaveBeenCalledWith(
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

  it('should show delete dialog when delete button is clicked for existing template', async () => {
    const { wrapper } = createWrapper({ isNewTemplate: false, isOwner: true })

    const deleteButton = wrapper.find('[data-label="Delete Template"]')
    await deleteButton.trigger('click')

    // Test that the delete dialog component is rendered in the DOM
    const deleteDialog = wrapper.findComponent({ name: 'DeleteDialog' })
    expect(deleteDialog.exists()).toBe(true)
    expect(deleteDialog.props('modelValue')).toBe(true)
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

    const shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
    expect(shareDialog.attributes('data-model-value')).toBe('true')
  })

  it('should reload templates when template is shared', async () => {
    const { wrapper, templatesStore } = createWrapper({ isOwner: true })

    const shareDialog = wrapper.findComponent(ShareExpenseTemplateDialogStub)
    await shareDialog.vm.$emit('shared')

    expect(templatesStore.loadTemplates).toHaveBeenCalledOnce()
  })

  it('should show save button for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    const saveButton = wrapper.find('[data-label="Save Template"]')
    expect(saveButton.exists()).toBe(true)
  })

  it('should show save button for existing template', () => {
    const { wrapper } = createWrapper()

    const saveButton = wrapper.find('[data-label="Save Template"]')
    expect(saveButton.exists()).toBe(true)
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
    mockUseExpenseTemplateItems.isValidForSave.value = false
    mockUseExpenseTemplateItems.hasValidItems.value = false

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(mockUseExpenseTemplate.createNewTemplateWithItems).not.toHaveBeenCalled()
    expect(mockUseExpenseTemplate.updateExistingTemplateWithItems).not.toHaveBeenCalled()
  })

  it('should display formatted total amount when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    expect(wrapper.text()).toContain('USD 500.00')
  })

  it('should show correct breadcrumb labels for new template', () => {
    const { wrapper } = createWrapper({ isNewTemplate: true })

    const breadcrumb = wrapper.find('[data-label="New Template"]')
    expect(breadcrumb.exists()).toBe(true)
  })

  it('should show correct breadcrumb labels for edit template', () => {
    const { wrapper } = createWrapper()

    const breadcrumb = wrapper.find('[data-label="Template"]')
    expect(breadcrumb.exists()).toBe(true)
  })

  it('should show correct breadcrumb labels for view template', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    const breadcrumb = wrapper.find('[data-label="Template"]')
    expect(breadcrumb.exists()).toBe(true)
  })

  it('should handle template loading and populate form', async () => {
    createWrapper()
    await flushPromises()

    expect(mockUseExpenseTemplate.loadTemplate).toHaveBeenCalledOnce()
    expect(mockUseExpenseTemplateItems.loadExpenseTemplateItems).toHaveBeenCalledWith(mockTemplate)
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

    const saveButton = wrapper.find('[data-label="Save Template"]')
    expect(saveButton.exists()).toBe(true)
  })

  it('should show category count chip when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const countChip = wrapper.find('.q-chip[data-label="1"]')
    expect(countChip.exists()).toBe(true)
  })

  it('should handle expense template item updates', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(ExpenseTemplateCategoryStub)
    await categoryComponent.vm.$emit('update-item', 'item-1', { name: 'Updated Item' })

    expect(mockUseExpenseTemplateItems.updateExpenseTemplateItem).toHaveBeenCalledWith('item-1', {
      name: 'Updated Item',
    })
  })

  it('should handle expense template item removal', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(ExpenseTemplateCategoryStub)
    await categoryComponent.vm.$emit('remove-item', 'item-1')

    expect(mockUseExpenseTemplateItems.removeExpenseTemplateItem).toHaveBeenCalledWith('item-1')
  })

  it('should handle adding new expense template item', async () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(ExpenseTemplateCategoryStub)
    await categoryComponent.vm.$emit('add-item', 'cat-1')

    expect(mockUseExpenseTemplateItems.addExpenseTemplateItem).toHaveBeenCalledWith(
      'cat-1',
      undefined,
    )
  })

  it('should show correct singular/plural text for category count', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    expect(wrapper.text()).toContain('Total across 1 category')
  })

  it('should display template name input with correct label', () => {
    const { wrapper } = createWrapper()

    const nameInput = wrapper.find('[data-label="Template Name"]')
    expect(nameInput.exists()).toBe(true)
  })

  it('should pass correct props to expense category components', () => {
    const { wrapper } = createWrapper({ hasItems: true })

    const categoryComponent = wrapper.findComponent(ExpenseTemplateCategoryStub)
    expect(categoryComponent.props('categoryId')).toBe('cat-1')
    expect(categoryComponent.props('categoryName')).toBe('Food')
    expect(categoryComponent.props('categoryColor')).toBe('#FF5722')
    expect(categoryComponent.props('currency')).toBe('USD')
    expect(categoryComponent.props('readonly')).toBe(false)
  })

  it('should pass readonly prop correctly in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, hasItems: true })

    const categoryComponent = wrapper.findComponent(ExpenseTemplateCategoryStub)
    expect(categoryComponent.props('readonly')).toBe(true)
  })
})
