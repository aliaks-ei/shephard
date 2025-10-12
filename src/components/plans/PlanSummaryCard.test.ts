import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanSummaryCard from './PlanSummaryCard.vue'
import type { PlanWithItems } from 'src/api'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/utils/plans', () => ({
  getStatusText: vi.fn(() => 'Active'),
  getStatusColor: vi.fn(() => 'green'),
  getStatusIcon: vi.fn(() => 'eva-play-circle-outline'),
  formatDateRange: vi.fn(() => 'Jan 1 - Jan 31, 2024'),
}))

vi.mock('src/utils/budget', () => ({
  getBudgetProgressColor: vi.fn(() => 'primary'),
  getBudgetRemainingColorClass: vi.fn(() => 'text-positive'),
}))

type PlanSummaryCardProps = ComponentProps<typeof PlanSummaryCard>

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

const renderPlanSummaryCard = (props: PlanSummaryCardProps) => {
  return mount(PlanSummaryCard, {
    props,
    global: {
      stubs: {
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-chip': {
          template: '<span class="q-chip"><slot /></span>',
          props: ['color', 'textColor', 'icon'],
        },
        'q-separator': { template: '<hr />' },
        'q-linear-progress': {
          template: '<div class="q-linear-progress" />',
          props: ['value', 'color', 'size'],
        },
      },
    },
  })
}

describe('PlanSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display plan name and date range', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Test Plan')
    expect(wrapper.text()).toContain('Jan 1 - Jan 31, 2024')
  })

  it('should display planned budget and spent amounts', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Planned Budget')
    expect(wrapper.text()).toContain('USD 1000.00')
    expect(wrapper.text()).toContain('Total Spent')
    expect(wrapper.text()).toContain('USD 500.00')
  })

  it('should display remaining amount when under budget', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Still to pay')
    expect(wrapper.text()).toContain('USD 500.00')
  })

  it('should display over amount when over budget', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 1200,
      stillToPay: -200,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Over')
    expect(wrapper.text()).toContain('USD 200.00')
  })

  it('should display progress percentage', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('50%')
  })

  it('should handle zero budget', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 0,
      totalSpent: 0,
      stillToPay: 0,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('USD 0.00')
  })

  it('should render progress bar', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 100,
      totalSpent: 50,
      stillToPay: 50,
      currency: 'USD',
    })

    const progressBar = wrapper.find('.q-linear-progress')
    expect(progressBar.exists()).toBe(true)
  })

  it('should display status chip', () => {
    const wrapper = renderPlanSummaryCard({
      plan: mockPlan,
      totalBudget: 1000,
      totalSpent: 500,
      stillToPay: 500,
      currency: 'USD',
    })

    const chip = wrapper.findComponent('.q-chip')
    expect(chip.exists()).toBe(true)
    expect(chip.text()).toContain('Active')
  })
})
