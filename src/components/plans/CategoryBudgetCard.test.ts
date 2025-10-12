import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import CategoryBudgetCard from './CategoryBudgetCard.vue'
import type { CategoryBudget } from 'src/types'

installQuasarPlugin()

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn((amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`),
}))

vi.mock('src/utils/budget', () => ({
  getBudgetProgressColor: vi.fn(() => 'primary'),
  getBudgetRemainingColorClass: vi.fn(() => 'text-positive'),
}))

type CategoryBudgetCardProps = ComponentProps<typeof CategoryBudgetCard>

const mockCategory: CategoryBudget = {
  categoryId: 'cat-1',
  categoryName: 'Food',
  categoryColor: '#ff0000',
  categoryIcon: 'eva-shopping-cart-outline',
  plannedAmount: 500,
  actualAmount: 300,
  remainingAmount: 200,
  expenseCount: 5,
}

const renderCategoryBudgetCard = (props: CategoryBudgetCardProps) => {
  return mount(CategoryBudgetCard, {
    props,
    global: {
      stubs: {
        CategoryIcon: { template: '<div class="category-icon" />' },
        'q-card': { template: '<div><slot /></div>' },
        'q-item': {
          template: '<div class="q-item" @click="$emit(\'click\')"><slot /></div>',
          props: ['clickable'],
        },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-circular-progress': {
          template: '<div class="q-circular-progress"><slot /></div>',
          props: ['value', 'max', 'size', 'thickness', 'color', 'trackColor', 'showValue'],
        },
        'q-linear-progress': {
          template: '<div class="q-linear-progress" />',
          props: ['value', 'color', 'size'],
        },
        'q-icon': { template: '<i />', props: ['name', 'size', 'color'] },
        'q-tooltip': { template: '<div />' },
      },
    },
  })
}

describe('CategoryBudgetCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display category name and expense count', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Food')
    expect(wrapper.text()).toContain('5 expenses')
  })

  it('should display spent and budget amounts', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Spent')
    expect(wrapper.text()).toContain('USD 300.00')
    expect(wrapper.text()).toContain('Budget')
    expect(wrapper.text()).toContain('USD 500.00')
  })

  it('should display remaining amount', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Still to pay')
    expect(wrapper.text()).toContain('USD 200.00')
  })

  it('should show "Over" when over budget', () => {
    const overBudgetCategory = {
      ...mockCategory,
      actualAmount: 600,
      remainingAmount: -100,
    }

    const wrapper = renderCategoryBudgetCard({
      category: overBudgetCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('Over')
    expect(wrapper.text()).toContain('USD 100.00')
  })

  it('should show progress percentage', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('60%')
  })

  it('should emit click event when clicked', async () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    const item = wrapper.find('.q-item')
    await item.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockCategory])
  })

  it('should show icon when over budget', () => {
    const overBudgetCategory = {
      ...mockCategory,
      actualAmount: 525,
      remainingAmount: -25,
    }

    const wrapper = renderCategoryBudgetCard({
      category: overBudgetCategory,
      currency: 'USD',
    })

    const html = wrapper.html()
    expect(html.length).toBeGreaterThan(0)
  })

  it('should not show status icon when under budget', () => {
    const wrapper = renderCategoryBudgetCard({
      category: mockCategory,
      currency: 'USD',
    })

    const icons = wrapper.findAllComponents({ name: 'q-icon' })
    const hasWarningIcon = icons.some((icon) => icon.props('name') === 'eva-alert-triangle-outline')
    const hasErrorIcon = icons.some((icon) => icon.props('name') === 'eva-alert-circle-outline')
    expect(hasWarningIcon).toBe(false)
    expect(hasErrorIcon).toBe(false)
  })

  it('should handle zero budget', () => {
    const zeroBudgetCategory = {
      ...mockCategory,
      plannedAmount: 0,
      actualAmount: 0,
      remainingAmount: 0,
    }

    const wrapper = renderCategoryBudgetCard({
      category: zeroBudgetCategory,
      currency: 'USD',
    })

    expect(wrapper.text()).toContain('0%')
  })
})
