import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'
import { ref } from 'vue'

import PlanOverviewTab from './PlanOverviewTab.vue'
import type { PlanWithItems } from 'src/api'

installQuasarPlugin()

vi.mock('src/composables/usePlanOverview', () => ({
  usePlanOverview: vi.fn(() => ({
    categoryBudgets: ref([]),
    recentExpenses: ref([]),
    totalBudget: ref(0),
    totalSpent: ref(0),
    remainingBudget: ref(0),
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
}))

type PlanOverviewTabProps = ComponentProps<typeof PlanOverviewTab>

const mockPlan: PlanWithItems = {
  id: 'plan-1',
  name: 'Test Plan',
  owner_id: 'user-1',
  currency: 'USD',
  total: 1000,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  status: 'active',
  template_id: 'template-1',
  created_at: '2023-12-01T00:00:00Z',
  updated_at: '2023-12-01T00:00:00Z',
  plan_items: [],
}

const renderPlanOverviewTab = (props: PlanOverviewTabProps) => {
  return mount(PlanOverviewTab, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        PlanSummaryCard: { template: '<div class="plan-summary-card" />' },
        CategoryBudgetCard: { template: '<div class="category-budget-card" />' },
        RecentExpensesList: { template: '<div class="recent-expenses-list" />' },
        CategoryExpensesDialog: { template: '<div class="category-expenses-dialog" />' },
        AllExpensesDialog: { template: '<div class="all-expenses-dialog" />' },
        CategoryIcon: { template: '<div />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-icon': { template: '<i />' },
      },
    },
  })
}

describe('PlanOverviewTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanOverviewTab({
      plan: mockPlan,
      isOwner: true,
      isEditMode: true,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display plan summary card', () => {
    const wrapper = renderPlanOverviewTab({
      plan: mockPlan,
      isOwner: true,
      isEditMode: true,
    })

    const summaryCard = wrapper.find('.plan-summary-card')
    expect(summaryCard.exists()).toBe(true)
  })

  it('should display recent expenses list', () => {
    const wrapper = renderPlanOverviewTab({
      plan: mockPlan,
      isOwner: true,
      isEditMode: true,
    })

    const list = wrapper.find('.recent-expenses-list')
    expect(list.exists()).toBe(true)
  })

  it('should emit refresh event', () => {
    const wrapper = renderPlanOverviewTab({
      plan: mockPlan,
      isOwner: true,
      isEditMode: true,
    })

    wrapper.vm.$emit('refresh')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })

  it('should emit open-expense-dialog event', () => {
    const wrapper = renderPlanOverviewTab({
      plan: mockPlan,
      isOwner: true,
      isEditMode: true,
    })

    wrapper.vm.$emit('open-expense-dialog', 'category-1')
    expect(wrapper.emitted('open-expense-dialog')).toBeTruthy()
  })
})
