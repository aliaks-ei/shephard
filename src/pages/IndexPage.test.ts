import { mount, flushPromises } from '@vue/test-utils'
import { it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { Screen } from 'quasar'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import IndexPage from './IndexPage.vue'
import { queryKeys } from 'src/queries/query-keys'
import { createMockPlans, createMockTemplates } from 'test/fixtures'

installQuasarPlugin()

const mockRouterPush = vi.fn()

const mockInvalidateQueries = vi.fn().mockResolvedValue(undefined)

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query')
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({
      invalidateQueries: mockInvalidateQueries,
    })),
  }
})

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('src/composables/useSortedRecentItems', () => ({
  useSortedRecentItems: (items: unknown) => items,
}))

const mockActivePlans = ref(createMockPlans())
const mockPlansForExpenses = ref(createMockPlans())
const mockPlansIsPending = ref(true)
const mockPlansIsError = ref(false)

vi.mock('src/queries/plans', () => ({
  usePlansQuery: vi.fn(() => ({
    plans: ref([]),
    plansForExpenses: mockPlansForExpenses,
    activePlans: mockActivePlans,
    ownedPlans: ref([]),
    sharedPlans: ref([]),
    isPending: mockPlansIsPending,
    isError: mockPlansIsError,
    isFetching: ref(false),
    refetch: vi.fn(),
    data: ref(null),
  })),
}))

const mockTemplatesData = ref(createMockTemplates())
const mockTemplatesIsPending = ref(true)
const mockTemplatesIsError = ref(false)

vi.mock('src/queries/templates', () => ({
  useTemplatesQuery: vi.fn(() => ({
    templates: mockTemplatesData,
    ownedTemplates: ref([]),
    sharedTemplates: ref([]),
    isPending: mockTemplatesIsPending,
    isError: mockTemplatesIsError,
    isFetching: ref(false),
    refetch: vi.fn(),
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
  usePlanOverviewSnapshotsQuery: vi.fn(() => ({
    snapshots: ref([]),
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
    data: ref(null),
  })),
  useRecentExpensesInfiniteQuery: vi.fn(() => ({
    expenses: ref([]),
    isPending: ref(false),
    isError: ref(false),
    isFetching: ref(false),
    refetch: vi.fn(),
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
        TopCategoriesCard: true,
        RecentActivityCard: true,
        PlanListItem: true,
        TemplateListItem: true,
      },
    },
  })
}

function setScreenWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })

  window.dispatchEvent(new Event('resize'))
}

beforeEach(() => {
  Screen.setDebounce(0)
  setScreenWidth(1280)
  vi.clearAllMocks()
  mockInvalidateQueries.mockResolvedValue(undefined)
  mockActivePlans.value = createMockPlans()
  mockPlansForExpenses.value = createMockPlans()
  mockTemplatesData.value = createMockTemplates()
  mockPlansIsPending.value = true
  mockTemplatesIsPending.value = true
  mockPlansIsError.value = false
  mockTemplatesIsError.value = false
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

it('should not open expense dialog without an eligible plan', async () => {
  mockPlansForExpenses.value = []
  const wrapper = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')
  await wrapper.vm.$nextTick()

  expect(wrapper.findComponent({ name: 'ExpenseRegistrationDialog' }).exists()).toBe(false)
})

it('should close expense dialog when expense is created', async () => {
  const wrapper = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')

  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  await expenseDialog.vm.$emit('expense-created')
  await wrapper.vm.$nextTick()

  expect(
    wrapper.findComponent({ name: 'ExpenseRegistrationDialog' }).attributes('modelvalue'),
  ).toBe('false')
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
  expect(wrapper.find('.col-12.col-lg-10.col-xl-8').exists()).toBe(true)
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
  expect(templatesSection?.attributes('icon')).toBe('eva-file-text-outline')
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

it('should render budget hero card for the most recently updated plan after loading', async () => {
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false

  const plans = createMockPlans()
  const freshestPlan = { ...plans[1]!, updated_at: '2024-02-01T00:00:00Z' }
  plans[1] = freshestPlan
  mockActivePlans.value = plans

  const wrapper = createWrapper()
  await flushPromises()

  const hero = wrapper.findComponent({ name: 'BudgetOverviewCard' })
  expect(hero.exists()).toBe(true)
  expect(hero.props('plan')).toMatchObject({ id: freshestPlan.id })
})

it('should not render budget hero card while loading', () => {
  const wrapper = createWrapper()

  expect(wrapper.findComponent({ name: 'BudgetOverviewCard' }).exists()).toBe(false)
  expect(wrapper.findAll('.q-skeleton').length).toBeGreaterThan(0)
})

it('should render top categories and recent activity cards when plans exist', async () => {
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false

  const wrapper = createWrapper()
  await flushPromises()

  expect(wrapper.findComponent({ name: 'TopCategoriesCard' }).exists()).toBe(true)
  expect(wrapper.findComponent({ name: 'RecentActivityCard' }).exists()).toBe(true)
})

it('should show standalone empty plans state when not loading and no active plans', async () => {
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false
  mockActivePlans.value = []

  const wrapper = createWrapper()
  await flushPromises()

  expect(wrapper.findComponent({ name: 'EmptyPlansState' }).exists()).toBe(true)
  expect(wrapper.findComponent({ name: 'BudgetOverviewCard' }).exists()).toBe(false)
  expect(wrapper.findComponent({ name: 'TopCategoriesCard' }).exists()).toBe(false)
  expect(wrapper.findComponent({ name: 'RecentActivityCard' }).exists()).toBe(false)
})

it('should show a retry state instead of the empty plans state when plans fail to load', async () => {
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false
  mockPlansIsError.value = true
  mockActivePlans.value = []

  const wrapper = createWrapper()
  await flushPromises()

  expect(wrapper.text()).toContain('Could not load plans')
  expect(wrapper.findComponent({ name: 'EmptyPlansState' }).exists()).toBe(false)
})

it('should show compact links instead of full sections on mobile', async () => {
  setScreenWidth(600)
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false

  const wrapper = createWrapper()
  await flushPromises()

  expect(wrapper.findAllComponents({ name: 'DashboardSection' })).toHaveLength(0)

  const items = wrapper.findAllComponents({ name: 'QItem' })
  const plansItem = items.find((item) => item.text().includes('Active plans'))
  const templatesItem = items.find((item) => item.text().includes('Templates'))

  expect(plansItem?.props('to')).toBe('/plans')
  expect(templatesItem?.props('to')).toBe('/templates')

  expect(plansItem?.text()).toContain(String(mockActivePlans.value.length))
  expect(templatesItem?.text()).toContain(String(mockTemplatesData.value.length))
  expect(plansItem?.text()).toContain('Review budgets and progress')
  expect(templatesItem?.text()).toContain('Reuse saved budget setups')
  expect(wrapper.find('.mobile-dashboard-links').exists()).toBe(true)
})

it('should not show compact links on mobile when there are no active plans', async () => {
  setScreenWidth(600)
  mockPlansIsPending.value = false
  mockTemplatesIsPending.value = false
  mockActivePlans.value = []

  const wrapper = createWrapper()
  await flushPromises()

  expect(wrapper.findAllComponents({ name: 'QItem' })).toHaveLength(0)
  expect(wrapper.findComponent({ name: 'EmptyPlansState' }).exists()).toBe(true)
})

it('should invalidate plans, templates and recent expenses queries on pull-to-refresh', async () => {
  const wrapper = createWrapper()

  const pullToRefresh = wrapper.findComponent({ name: 'QPullToRefresh' })
  expect(pullToRefresh.exists()).toBe(true)

  const done = vi.fn()
  pullToRefresh.vm.$emit('refresh', done)
  await vi.waitFor(() => {
    expect(done).toHaveBeenCalledOnce()
  })

  expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.plans.all })
  expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.templates.all })
  expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.expenses.recentAll() })
})
