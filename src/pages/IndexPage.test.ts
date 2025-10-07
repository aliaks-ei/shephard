import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { it, expect, vi, beforeEach } from 'vitest'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import IndexPage from './IndexPage.vue'
import { usePlansStore } from 'src/stores/plans'
import { useTemplatesStore } from 'src/stores/templates'
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

function createWrapper() {
  const wrapper = mount(IndexPage, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
        }),
      ],
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
      },
    },
  })

  const plansStore = usePlansStore()
  const templatesStore = useTemplatesStore()

  return { wrapper, plansStore, templatesStore }
}

beforeEach(() => {
  vi.clearAllMocks()
})

it('should mount component properly', () => {
  const { wrapper } = createWrapper()
  expect(wrapper.exists()).toBe(true)
})

it('should load plans and templates on mount', async () => {
  const { plansStore, templatesStore } = createWrapper()

  await flushPromises()

  expect(plansStore.loadPlans).toHaveBeenCalled()
  expect(templatesStore.loadTemplates).toHaveBeenCalled()
})

it('should display active plans section', () => {
  const { wrapper } = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  expect(dashboardSections.length).toBeGreaterThanOrEqual(1)
})

it('should display recent templates section', () => {
  const { wrapper } = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  expect(dashboardSections.length).toBeGreaterThanOrEqual(2)
})

it('should open expense dialog when quick action is triggered', async () => {
  const { wrapper } = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')
  await wrapper.vm.$nextTick()

  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  expect(expenseDialog.attributes('modelvalue')).toBe('true')
})

it('should close expense dialog when expense is created', async () => {
  const { wrapper } = createWrapper()
  const quickActionsGrid = wrapper.findComponent({ name: 'QuickActionsGrid' })

  await quickActionsGrid.vm.$emit('add-expense')

  const expenseDialog = wrapper.findComponent({ name: 'ExpenseRegistrationDialog' })
  await expenseDialog.vm.$emit('expense-created')

  expect(expenseDialog.attributes('modelvalue')).toBe('false')
})

it('should navigate to plan when edit is triggered', async () => {
  const { wrapper, plansStore } = createWrapper()

  const mockPlans = createMockPlans()
  // @ts-expect-error - Testing Pinia store
  plansStore.activePlans = mockPlans

  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  const plansSection = dashboardSections[0]

  await plansSection?.vm.$emit('card', { item: mockPlans[0] })

  const planCard = wrapper.findComponent({ name: 'PlanCard' })
  if (planCard.exists()) {
    await planCard.vm.$emit('edit', mockPlans[0]?.id)
    expect(mockRouterPush).toHaveBeenCalledWith({ name: 'plan', params: { id: mockPlans[0]?.id } })
  }
})

it('should navigate to template when edit is triggered', async () => {
  const { wrapper, templatesStore } = createWrapper()

  const mockTemplates = createMockTemplates()
  templatesStore.templates = mockTemplates

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

it('should open share plan dialog when share is triggered', async () => {
  const { wrapper, plansStore } = createWrapper()

  const mockPlans = createMockPlans()
  // @ts-expect-error - Testing Pinia store
  plansStore.activePlans = mockPlans

  await wrapper.vm.$nextTick()

  const planCard = wrapper.findComponent({ name: 'PlanCard' })
  if (planCard.exists()) {
    await planCard.vm.$emit('share', mockPlans[0]?.id)
    await wrapper.vm.$nextTick()

    const shareDialog = wrapper.findComponent({ name: 'SharePlanDialog' })
    expect(shareDialog.exists()).toBe(true)
    expect(shareDialog.attributes('modelvalue')).toBe('true')
  }
})

it('should open share template dialog when share is triggered', async () => {
  const { wrapper, templatesStore } = createWrapper()

  const mockTemplates = createMockTemplates()
  templatesStore.templates = mockTemplates

  await wrapper.vm.$nextTick()

  const templateCard = wrapper.findComponent({ name: 'TemplateCard' })
  if (templateCard.exists()) {
    await templateCard.vm.$emit('share', mockTemplates[0]?.id)
    await wrapper.vm.$nextTick()

    const shareDialog = wrapper.findComponent({ name: 'ShareTemplateDialog' })
    expect(shareDialog.exists()).toBe(true)
    expect(shareDialog.attributes('modelvalue')).toBe('true')
  }
})

it('should render with proper responsive layout', () => {
  const { wrapper } = createWrapper()
  expect(wrapper.find('.row.justify-center').exists()).toBe(true)
  expect(wrapper.find('.col-12.col-md-10.col-lg-8.col-xl-6').exists()).toBe(true)
})

it('should pass correct data to plans section', async () => {
  const { wrapper, plansStore } = createWrapper()

  const mockPlans = createMockPlans()
  // @ts-expect-error - Testing Pinia store
  plansStore.activePlans = mockPlans

  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  const plansSection = dashboardSections[0]

  expect(plansSection?.attributes('title')).toBe('Active Plans')
  expect(plansSection?.attributes('icon')).toBe('eva-calendar-outline')
  expect(plansSection?.props('viewAllRoute')).toBe('/plans')
})

it('should pass correct data to templates section', async () => {
  const { wrapper, templatesStore } = createWrapper()

  const mockTemplates = createMockTemplates()
  templatesStore.templates = mockTemplates

  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })
  const templatesSection = dashboardSections[1]

  expect(templatesSection?.attributes('title')).toBe('Recent Templates')
  expect(templatesSection?.attributes('icon')).toBe('eva-bookmark-outline')
  expect(templatesSection?.props('viewAllRoute')).toBe('/templates')
})

it('should show loading state initially', () => {
  const { wrapper } = createWrapper()
  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })

  dashboardSections.forEach((section) => {
    expect(section.attributes('loading')).toBe('true')
  })
})

it('should hide loading state after data loads', async () => {
  const { wrapper, plansStore, templatesStore } = createWrapper()

  plansStore.loadPlans = vi.fn().mockResolvedValue(undefined)
  templatesStore.loadTemplates = vi.fn().mockResolvedValue(undefined)

  await flushPromises()
  await wrapper.vm.$nextTick()

  const dashboardSections = wrapper.findAllComponents({ name: 'DashboardSection' })

  dashboardSections.forEach((section) => {
    expect(section.attributes('loading')).toBe('false')
  })
})
