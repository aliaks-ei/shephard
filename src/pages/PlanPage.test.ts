import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach, describe } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { ref, computed } from 'vue'
import PlanPage from './PlanPage.vue'
import type { Category, TemplateWithItems, PlanWithItems } from 'src/api'
import type { PlanItemUI } from 'src/types'
import type { PlanCategoryGroup } from 'src/composables/usePlanItems'

installQuasarPlugin()

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    Notify: {
      create: vi.fn(),
    },
  }
})

const mockRouterPush = vi.fn()
const mockRoute = {
  name: 'edit-plan',
  params: { id: 'plan-1' },
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

vi.mock('src/utils/plans', () => ({
  calculateEndDate: vi.fn((startDate: Date, duration: string) => {
    const endDate = new Date(startDate)
    if (duration === 'weekly') endDate.setDate(endDate.getDate() + 7)
    else if (duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else if (duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)
    return endDate
  }),
  getPlanStatus: vi.fn(() => 'active'),
  getStatusText: vi.fn(() => 'Active'),
  getStatusColor: vi.fn(() => 'positive'),
  getStatusIcon: vi.fn(() => 'eva-checkmark-circle-outline'),
  formatDateRange: vi.fn((start: string, end: string) => `${start} - ${end}`),
}))

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

const mockCategoriesRef = ref(mockCategories.map((c) => ({ ...c, templates: [] })))

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: mockCategoriesRef,
    getCategoryById: vi.fn((id: string) => mockCategoriesRef.value.find((c) => c.id === id)),
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

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

const mockTemplatesRef = ref([mockTemplate])
const mockTemplatesIsPending = ref(false)

vi.mock('src/queries/templates', () => ({
  useTemplatesQuery: vi.fn(() => ({
    templates: mockTemplatesRef,
    ownedTemplates: ref([]),
    sharedTemplates: ref([]),
    isPending: mockTemplatesIsPending,
    templatesCount: computed(() => mockTemplatesRef.value.length),
    data: ref(null),
  })),
  useTemplateDetailQuery: vi.fn(() => ({
    data: ref(null),
    isPending: ref(false),
  })),
}))

vi.mock('src/queries/plans', () => ({
  useDeletePlanMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
}))

vi.mock('src/queries/sharing', () => ({
  useSharedUsersQuery: vi.fn(() => ({
    data: ref([]),
    isPending: ref(false),
  })),
  useShareEntityMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useUnshareEntityMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useUpdatePermissionMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useSearchUsersQuery: vi.fn(() => ({
    data: ref([]),
    isPending: ref(false),
  })),
}))

vi.mock('src/queries/expenses', () => ({
  useExpensesByPlanQuery: vi.fn(() => ({
    expenses: ref([]),
    totalExpensesAmount: ref(0),
    sortedExpenses: ref([]),
    expensesByCategory: ref({}),
    getExpensesForPlanItem: vi.fn(() => []),
    isPending: ref(false),
    data: ref(null),
  })),
  useExpenseSummaryQuery: vi.fn(() => ({
    expenseSummary: ref([]),
    isPending: ref(false),
    data: ref(null),
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1', name: 'Test User' },
    preferences: { theme: 'dark' },
  })),
}))

vi.mock('src/api', () => ({
  getTemplateWithItems: vi.fn(),
}))

const mockUsePlan = {
  currentPlan: ref<PlanWithItems | null>(null),
  isPlanLoading: ref(false),
  isNewPlan: ref(false),
  isOwner: ref(true),
  isReadOnlyMode: ref(false),
  isEditMode: ref(true),
  canEditPlanData: ref(true),
  planCurrency: ref('USD'),
  createNewPlanWithItems: vi.fn(),
  updateExistingPlanWithItems: vi.fn(),
  loadPlan: vi.fn(),
  cancelCurrentPlan: vi.fn(),
}

vi.mock('src/composables/usePlan', () => ({
  usePlan: () => mockUsePlan,
}))

const mockPlanItems: PlanItemUI[] = [
  {
    id: 'item-1',
    name: 'Groceries',
    categoryId: 'cat-1',
    amount: 500,
    color: '#FF5722',
    isFixedPayment: true,
  },
]

const mockUsePlanItems = {
  planItems: ref<PlanItemUI[]>([]),
  totalAmount: ref(0),
  hasItems: ref(false),
  hasValidItems: ref(false),
  hasDuplicateItems: ref(false),
  isValidForSave: ref(false),
  planCategoryGroups: ref<PlanCategoryGroup[]>([]),
  addPlanItem: vi.fn(),
  updatePlanItem: vi.fn(),
  removePlanItem: vi.fn(),
  loadPlanItems: vi.fn(),
  loadPlanItemsFromTemplate: vi.fn(),
  getPlanItemsForSave: vi.fn(() => []),
}

vi.mock('src/composables/usePlanItems', () => ({
  usePlanItems: () => mockUsePlanItems,
}))

const mockUseDetailPageState = {
  pageTitle: ref('Edit Plan'),
}

vi.mock('src/composables/useDetailPageState', () => ({
  useDetailPageState: () => mockUseDetailPageState,
}))

const mockUseEditablePage = {
  fabOpen: ref(false),
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  getDialogState: vi.fn(() => false),
  createFabAction: vi.fn((fn) => fn),
  initializeFab: vi.fn(),
}

vi.mock('src/composables/useEditablePage', () => ({
  useEditablePage: () => mockUseEditablePage,
}))

vi.mock('src/composables/useExpenseRegistration', () => ({
  useExpenseRegistration: vi.fn(() => ({
    form: ref({
      planId: null,
      categoryId: null,
      name: '',
      amount: null,
      expenseDate: '2024-01-15',
      planItemId: null,
    }),
    isLoading: ref(false),
    isLoadingPlanItems: ref(false),
    didAutoSelectPlan: ref(false),
    currentMode: ref('quick-select'),
    quickSelectPhase: ref('selection'),
    planItems: ref([]),
    selectedPlanItems: ref([]),
    planOptions: computed(() => []),
    selectedPlan: computed(() => null),
    planDisplayValue: computed(() => ''),
    categoryOptions: computed(() => []),
    selectedItemsTotal: computed(() => 0),
    nameRules: computed(() => []),
    amountRules: computed(() => []),
    getSubmitButtonLabel: computed(() => 'Continue'),
    canSubmit: computed(() => false),
    showBackButton: computed(() => false),
    onPlanSelected: vi.fn(),
    onItemsSelected: vi.fn(),
    onSelectionChanged: vi.fn(),
    goBackToSelection: vi.fn(),
    proceedToFinalize: vi.fn(),
    removeSelectedItem: vi.fn(),
    resetForm: vi.fn(),
    handleQuickSelectSubmit: vi.fn(),
    handleCustomEntrySubmit: vi.fn(),
    initialize: vi.fn(),
    determineInitialMode: vi.fn(),
  })),
}))

const PlanCategoryStub = {
  template:
    '<div class="plan-category-mock" :data-category-id="categoryId" :data-readonly="readonly"></div>',
  props: [
    'categoryId',
    'categoryName',
    'categoryColor',
    'items',
    'currency',
    'defaultExpanded',
    'readonly',
  ],
  emits: ['update-item', 'remove-item', 'add-item'],
}

const SharePlanDialogStub = {
  template:
    '<div class="share-plan-dialog-mock" :data-model-value="modelValue" :data-plan-id="planId"></div>',
  props: ['modelValue', 'planId'],
  emits: ['update:modelValue', 'shared'],
}

const mockPlan: PlanWithItems = {
  id: 'plan-1',
  name: 'My Plan',
  template_id: 'template-1',
  start_date: '2023-06-01',
  end_date: '2023-06-30',
  status: 'active',
  total: 1500,
  currency: 'USD',
  owner_id: 'user-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  plan_items: [
    {
      id: 'item-1',
      plan_id: 'plan-1',
      name: 'Groceries',
      category_id: 'cat-1',
      amount: 500,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      is_completed: false,
      is_fixed_payment: true,
    },
  ],
}

function createWrapper(
  options: {
    isNewPlan?: boolean
    isLoading?: boolean
    isReadOnlyMode?: boolean
    isOwner?: boolean
    canEditPlanData?: boolean
    hasItems?: boolean
    hasDuplicates?: boolean
    currentPlan?: PlanWithItems | null
  } = {},
) {
  const {
    isNewPlan = false,
    isLoading = false,
    isReadOnlyMode = false,
    isOwner = true,
    canEditPlanData = true,
    hasItems = false,
    hasDuplicates = false,
    currentPlan = null,
  } = options

  mockUsePlan.isNewPlan.value = isNewPlan
  mockUsePlan.isPlanLoading.value = isLoading
  mockUsePlan.isReadOnlyMode.value = isReadOnlyMode
  mockUsePlan.isEditMode.value = !isReadOnlyMode
  mockUsePlan.isOwner.value = isOwner
  mockUsePlan.canEditPlanData.value = canEditPlanData
  mockUsePlan.currentPlan.value = currentPlan

  if (hasItems) {
    mockUsePlanItems.planItems.value = mockPlanItems
    mockUsePlanItems.totalAmount.value = 500
    mockUsePlanItems.isValidForSave.value = !hasDuplicates
    mockUsePlanItems.planCategoryGroups.value = [
      {
        categoryId: 'cat-1',
        categoryName: 'Food',
        categoryColor: '#FF5722',
        categoryIcon: 'eva-pricetags-outline',
        items: mockPlanItems,
        subtotal: 500,
      },
    ]
  } else {
    mockUsePlanItems.planItems.value = []
    mockUsePlanItems.totalAmount.value = 0
    mockUsePlanItems.isValidForSave.value = false
    mockUsePlanItems.planCategoryGroups.value = []
  }

  mockUsePlanItems.hasDuplicateItems.value = hasDuplicates

  const wrapper = mount(PlanPage, {
    global: {
      stubs: {
        PlanCategory: PlanCategoryStub,
        SharePlanDialog: SharePlanDialogStub,
        QForm: {
          template: '<form @submit.prevent="handleSubmit"><slot /></form>',
          emits: ['submit'],
          methods: {
            validate: vi.fn(() => Promise.resolve(true)),
            handleSubmit(event: Event) {
              event.preventDefault()
              this.$emit('submit', event)
            },
          },
        },
        QCard: { template: '<div class="q-card"><slot /></div>' },
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
          props: [
            'modelValue',
            'options',
            'outlined',
            'emitValue',
            'mapOptions',
            'optionLabel',
            'optionValue',
            'loading',
          ],
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
          props: ['label', 'color', 'textColor', 'size', 'ripple', 'outline', 'icon'],
        },
        QBanner: { template: '<div class="q-banner"><slot name="avatar" /><slot /></div>' },
        QSeparator: { template: '<hr class="q-separator" />' },
        QSkeleton: {
          template:
            '<div class="q-skeleton" :data-type="type" :data-width="width" :data-height="height"></div>',
          props: ['type', 'width', 'height'],
        },
        QDialog: {
          template: '<div v-if="modelValue" class="q-dialog"><slot /></div>',
          props: ['modelValue', 'persistent'],
          emits: ['update:modelValue'],
        },
        QCardSection: { template: '<div class="q-card-section"><slot /></div>', props: ['class'] },
        QCardActions: { template: '<div class="q-card-actions"><slot /></div>', props: ['align'] },
        QDate: {
          template: '<div class="q-date"><slot /></div>',
          props: ['modelValue', 'mask'],
          emits: ['update:modelValue'],
        },
        QPopupProxy: {
          template: '<div class="q-popup-proxy"><slot /></div>',
          props: ['cover', 'transitionShow', 'transitionHide'],
        },
        ActionsFab: {
          template:
            '<div v-if="visible" class="actions-fab"><button v-for="action in visibleActions" :key="action.key" :data-label="action.label" @click="$emit(\'action-clicked\', action.key); action.handler()">{{ action.label }}</button></div>',
          props: ['modelValue', 'actions', 'visible'],
          emits: ['update:modelValue', 'action-clicked'],
          computed: {
            visibleActions() {
              return this.actions.filter((action: { visible: boolean }) => action.visible !== false)
            },
          },
        },
        DeleteDialog: true,
        ExpenseRegistrationDialog: true,
        PlanTemplateSelection: true,
        PlanFormSection: true,
        PlanEditTab: true,
        PlanOverviewTab: true,
        PlanItemsTrackingTab: true,
      },
    },
  })

  return { wrapper }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRoute.name = 'edit-plan'
  mockRoute.params = { id: 'plan-1' }

  mockUsePlan.loadPlan.mockResolvedValue(mockPlan)
  mockUsePlan.createNewPlanWithItems.mockResolvedValue(true)
  mockUsePlan.updateExistingPlanWithItems.mockResolvedValue(true)
})

describe('PlanPage', () => {
  it('should mount component properly', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.exists()).toBe(true)
  })

  it('should call loadPlan on mount', async () => {
    createWrapper()
    await flushPromises()

    expect(mockUsePlan.loadPlan).toHaveBeenCalledOnce()
  })

  it('should render edit form when in edit mode and can edit plan data', () => {
    const { wrapper } = createWrapper({ canEditPlanData: true, isNewPlan: true })

    expect(wrapper.findComponent({ name: 'PlanFormSection' }).exists()).toBe(true)
  })

  it('should render readonly view when in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, currentPlan: mockPlan })

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Overview')
  })

  it('should show form section for new plan', () => {
    const { wrapper } = createWrapper({ isNewPlan: true })

    expect(wrapper.findComponent({ name: 'PlanFormSection' }).exists()).toBe(true)
  })

  it('should not show template selection for existing plan', () => {
    const { wrapper } = createWrapper({ isNewPlan: false })

    expect(wrapper.text()).not.toContain('Select Template')
  })

  it('should show read-only banner when in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, currentPlan: mockPlan })

    expect(wrapper.text()).toContain('view only')
  })

  it('should show form section when no plan items for new plan', () => {
    const { wrapper } = createWrapper({ isNewPlan: true })

    expect(wrapper.findComponent({ name: 'PlanFormSection' }).exists()).toBe(true)
  })

  it('should show plan categories when items exist', () => {
    const { wrapper } = createWrapper({ hasItems: true, isNewPlan: true })

    expect(wrapper.findComponent({ name: 'PlanFormSection' }).exists()).toBe(true)
  })

  it('should show duplicate items warning when duplicates exist', () => {
    createWrapper({ hasItems: true, hasDuplicates: true, isNewPlan: true })

    expect(mockUsePlanItems.hasDuplicateItems.value).toBe(true)
  })

  it('should render plan form section for new plan', () => {
    const { wrapper } = createWrapper({ isNewPlan: true })

    const formSection = wrapper.findComponent({ name: 'PlanFormSection' })
    expect(formSection.exists()).toBe(true)
  })

  it('should navigate back when back button is clicked', async () => {
    const { wrapper } = createWrapper()

    const backButton = wrapper.find('.q-btn')
    await backButton.trigger('click')

    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'plans' })
  })

  it('should show share button for existing plan when owner', () => {
    const { wrapper } = createWrapper({ isOwner: true, currentPlan: mockPlan })

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.exists()).toBe(true)
  })

  it('should not show share button for new plan', () => {
    const { wrapper } = createWrapper({ isNewPlan: true })

    const shareButton = wrapper.find('[data-label="Share"]')
    expect(shareButton.exists()).toBe(false)
  })

  it('should open share dialog when share button is clicked', async () => {
    const { wrapper } = createWrapper({ isOwner: true, currentPlan: mockPlan })

    const shareButton = wrapper.find('[data-label="Share"]')
    await shareButton.trigger('click')

    expect(mockUseEditablePage.openDialog).toHaveBeenCalledWith('share')
  })

  it('should display formatted total amount when items exist', () => {
    createWrapper({ hasItems: true, isNewPlan: true })

    expect(mockUsePlanItems.totalAmount.value).toBe(500)
  })

  it('should show correct page title for new plan', () => {
    mockUseDetailPageState.pageTitle.value = 'Create Plan'
    const { wrapper } = createWrapper({ isNewPlan: true })

    expect(wrapper.text()).toContain('Create Plan')
  })

  it('should show correct page title for edit plan', () => {
    mockUseDetailPageState.pageTitle.value = 'Edit Plan'
    const { wrapper } = createWrapper()

    expect(wrapper.text()).toContain('Edit Plan')
  })

  it('should show correct page title for view plan', () => {
    mockUseDetailPageState.pageTitle.value = 'View Plan'
    const { wrapper } = createWrapper({ isReadOnlyMode: true })

    expect(wrapper.text()).toContain('View Plan')
  })

  it('should handle plan loading and populate form', async () => {
    createWrapper({ currentPlan: mockPlan })
    await flushPromises()

    expect(mockUsePlan.loadPlan).toHaveBeenCalledOnce()
    expect(mockUsePlanItems.loadPlanItems).toHaveBeenCalledWith(mockPlan)
  })

  it('should handle plan item updates', () => {
    createWrapper({ hasItems: true, isNewPlan: true })
    expect(mockUsePlanItems.updatePlanItem).toBeDefined()
  })

  it('should handle plan item removal', () => {
    createWrapper({ hasItems: true, isNewPlan: true })
    expect(mockUsePlanItems.removePlanItem).toBeDefined()
  })

  it('should handle adding new plan item', () => {
    createWrapper({ hasItems: true, isNewPlan: true })
    expect(mockUsePlanItems.addPlanItem).toBeDefined()
  })

  it('should show cancel plan dialog when cancel button clicked', () => {
    const { wrapper } = createWrapper({ isOwner: true, currentPlan: mockPlan })

    const deleteDialog = wrapper.findComponent({ name: 'DeleteDialog' })
    expect(deleteDialog.exists()).toBe(true)
  })

  it('should display plan status in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, currentPlan: mockPlan })

    expect(wrapper.text()).toContain('Overview')
  })

  it('should display overview tab in read-only mode', () => {
    const { wrapper } = createWrapper({ isReadOnlyMode: true, currentPlan: mockPlan })

    expect(wrapper.text()).toContain('Overview')
    expect(wrapper.findComponent({ name: 'PlanOverviewTab' }).exists()).toBe(true)
  })
})
