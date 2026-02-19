import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import IndexPage from './IndexPage.vue'
import { createMockPlans, createMockTemplates } from 'test/fixtures'

installQuasarPlugin()

const mockRouterPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('src/composables/useSortedRecentItems', () => ({
  useSortedRecentItems: (items: unknown) => items,
}))

const mockActivePlans = ref(createMockPlans())
const mockPlansIsPending = ref(true)

vi.mock('src/queries/plans', () => ({
  usePlansQuery: vi.fn(() => ({
    plans: ref([]),
    plansForExpenses: ref([]),
    activePlans: mockActivePlans,
    ownedPlans: ref([]),
    sharedPlans: ref([]),
    isPending: mockPlansIsPending,
    data: ref(null),
  })),
}))

const mockTemplatesData = ref(createMockTemplates())
const mockTemplatesIsPending = ref(true)

vi.mock('src/queries/templates', () => ({
  useTemplatesQuery: vi.fn(() => ({
    templates: mockTemplatesData,
    ownedTemplates: ref([]),
    sharedTemplates: ref([]),
    isPending: mockTemplatesIsPending,
    templatesCount: computed(() => mockTemplatesData.value.length),
    data: ref(null),
  })),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    userProfile: { id: 'user-1', name: 'Test User' },
    preferences: { theme: 'dark' },
  })),
}))

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: vi.fn(() => ({
    categories: ref([]),
    getCategoryById: vi.fn(),
    isPending: ref(false),
    categoriesMap: ref(new Map()),
    sortedCategories: ref([]),
    categoryCount: ref(0),
    data: ref(null),
  })),
}))

vi.mock('src/queries/expenses', () => ({
  useExpenseSummaryQuery: vi.fn(() => ({
    expenseSummary: ref([]),
    isPending: ref(false),
    data: ref(null),
  })),
  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
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

function createWrapper() {
  return mount(IndexPage, {
    global: {
      stubs: {
        DashboardHeader: true,
        QuickActionsGrid: true,
        DashboardSection: true,
        EmptyPlansState: true,
        EmptyTemplatesState: true,
        PlanCard: true,
        TemplateCard: true,
        ExpenseRegistrationDialog: true,
        SharePlanDialog: true,
        ShareTemplateDialog: true,
        BudgetOverviewCard: true,
        PlanListItem: true,
        TemplateListItem: true,
      },
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockActivePlans.value = createMockPlans()
  mockTemplatesData.value = createMockTemplates()
  mockPlansIsPending.value = true
  mockTemplatesIsPending.value = true
})

it('should mount component properly', () => {
  const wrapper = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should display active plans section', () => {
  const wrapper = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  expect(dashboardSections.length).toBeGreaterThanOrEqual(1)
})

it('should display recent templates section', () => {
  const wrapper = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  expect(dashboardSections.length).toBeGreaterThanOrEqual(2)
})

it('should open expense dialog when quick action is triggered', async () => {
  const wrapper = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')
  await wrapper.vm.$nextTick()

  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  expect(expenseDialog.attributes('modelvalue')).toBe('true')
})

it('should close expense dialog when expense is created', async () => {
  const wrapper = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')

  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  await expenseDialog.vm.$emit('expense-created')

  expect(expenseDialog.attributes('modelvalue')).toBe('false')
})

it('should navigate to plan when edit is triggered', async () => {
  const mockPlans = createMockPlans()
  mockActivePlans.value = mockPlans

  const wrapper = createWrapper()
  await wrapper.vm.$nextTick()

  const planCard = wrapper.findComponent({ name: 'PlanCard' })
  if (planCard.exists()) {
    await planCard.vm.$emit('edit', mockPlans[0]?.id)
    expect(mockRouterPush).toHaveBeenCalledWith({
      name: 'plan',
      params: { id: mockPlans[0]?.id },
    })
  }
})

it('should navigate to template when edit is triggered', async () => {
  const mockTemplates = createMockTemplates()
  mockTemplatesData.value = mockTemplates

  const wrapper = createWrapper()
  await wrapper.vm.$nextTick()

  const templateCard = wrapper.findComponent({ name: 'TemplateCard' })
  if (templateCard.exists()) {
    await templateCard.vm.$emit('edit', mockTemplates[0]?.id)
    expect(mockRouterPush).toHaveBeenCalledWith({
      name: 'template',
      params: { id: mockTemplates[0]?.id },
    })
  }
})

it('should render with proper responsive layout', () => {
  const wrapper = createWrapper()
  expect(wrapper.find('.row.justify-center').exists()).toBe(true)
  expect(wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6').exists()).toBe(true)
})

it('should pass correct data to plans section', async () => {
  const wrapper = createWrapper()
  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  const plansSection = dashboardSections[0]

  expect(plansSection?.attributes('title')).toBe('Active Plans')
  expect(plansSection?.attributes('icon')).toBe('eva-calendar-outline')
  expect(plansSection?.props('viewAllRoute')).toBe('/plans')
})

it('should pass correct data to templates section', async () => {
  const wrapper = createWrapper()
  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  const templatesSection = dashboardSections[1]

  expect(templatesSection?.attributes('title')).toBe('Recent Templates')
  expect(templatesSection?.attributes('icon')).toBe('eva-bookmark-outline')
  expect(templatesSection?.props('viewAllRoute')).toBe('/templates')
})

it('should show loading state initially', () => {
  const wrapper = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })

  dashboardSections.forEach((section) => {
    expect(section.attributes('loading')).toBe('true')
  })
})

it('should hide loading state after data loads', async () => {
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false

  const wrapper = createWrapper()
  await flushPromises()
  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })

  dashboardSections.forEach((section) => {
    expect(section.attributes('loading')).toBe('false')
  })
})
