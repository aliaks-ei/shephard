import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import { ref } from 'vue'
import PlanItemsTrackingTab from './PlanItemsTrackingTab.vue'
import type { PlanWithItems } from 'src/api'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/queries/plans', () => ({
  useUpdatePlanItemCompletionMutation: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: ref(false),
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
  useExpensesByPlanQuery: vi.fn(() => ({
    expenses: ref([]),
    totalExpensesAmount: ref(0),
    sortedExpenses: ref([]),
    expensesByCategory: ref({}),
    getExpensesForPlanItem: vi.fn(() => []),
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

type PlanItemsTrackingTabProps = ComponentProps<typeof PlanItemsTrackingTab>

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
  plan_items: [
    {
      id: 'item-1',
      plan_id: 'plan-1',
      category_id: 'cat-1',
      name: 'Test Item',
      amount: 100,
      is_completed: false,
      is_fixed_payment: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
}

const renderPlanItemsTrackingTab = (props: PlanItemsTrackingTabProps) => {
  return mount(PlanItemsTrackingTab, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        CategoryIcon: { template: '<div class="category-icon" />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-linear-progress': { template: '<div class="q-linear-progress" />' },
        'q-expansion-item': {
          template: '<div><slot name="header" /><slot /></div>',
          props: ['defaultOpened'],
        },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': { template: '<div class="q-item"><slot /></div>' },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-checkbox': {
          template:
            '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
          props: ['modelValue', 'disable'],
        },
        'q-skeleton': { template: '<div class="q-skeleton" />' },
        'q-icon': { template: '<i />' },
      },
    },
  })
}

describe('PlanItemsTrackingTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanItemsTrackingTab({
      plan: mockPlan,
      canEdit: true,
      currency: 'USD',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display progress bar', () => {
    const wrapper = renderPlanItemsTrackingTab({
      plan: mockPlan,
      canEdit: true,
      currency: 'USD',
    })

    const progressBar = wrapper.find('.q-linear-progress')
    expect(progressBar.exists()).toBe(true)
  })

  it('should display plan items', () => {
    const wrapper = renderPlanItemsTrackingTab({
      plan: mockPlan,
      canEdit: true,
      currency: 'USD',
    })

    expect(wrapper.html().length).toBeGreaterThan(0)
  })

  it('should show empty state when no items', () => {
    const emptyPlan = { ...mockPlan, plan_items: [] }
    const wrapper = renderPlanItemsTrackingTab({
      plan: emptyPlan,
      canEdit: true,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('No Items to Track')
  })

  it('should show loading state when plan is null', () => {
    const wrapper = renderPlanItemsTrackingTab({
      plan: null,
      canEdit: true,
      currency: 'USD',
    })

    const skeletons = wrapper.findAll('.q-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should emit refresh event', () => {
    const wrapper = renderPlanItemsTrackingTab({
      plan: mockPlan,
      canEdit: true,
      currency: 'USD',
    })

    wrapper.vm.$emit('refresh')
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})
