import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import BudgetImpactCard from './BudgetImpactCard.vue'

installQuasarPlugin()

describe('BudgetImpactCard', () => {
  const mockCategoryOption = {
    label: 'Food',
    value: 'cat-1',
    color: '#FF5722',
    icon: 'eva-pricetags-outline',
    plannedAmount: 100,
    actualAmount: 50,
    remainingAmount: 50,
  }

  const defaultProps = {
    categoryId: null,
    amount: null,
    currency: null,
    categoryOption: null,
  }

  it('should mount component properly', () => {
    const wrapper = mount(BudgetImpactCard, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display budget impact title', () => {
    const wrapper = mount(BudgetImpactCard, {
      props: defaultProps,
    })

    expect(wrapper.text()).toContain('Budget Impact')
  })

  describe('Empty State', () => {
    it('should show empty state when no category is selected', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: null,
        },
      })

      expect(wrapper.text()).toContain('Select a category and enter amount to see budget impact')
      const icon = wrapper.findComponent({ name: 'QIcon' })
      expect(icon.exists()).toBe(true)
      expect(icon.props('name')).toBe('eva-info-outline')
    })
  })

  describe('Current Budget State', () => {
    it('should show current budget state when category selected but no amount', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: null,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('Remaining:')
      expect(wrapper.text()).toContain('$50.00 left')
      expect(wrapper.text()).toContain('Enter an amount to see the impact on this budget')
    })

    it('should show progress bar with current budget percentage', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: null,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('50% used')
      expect(wrapper.text()).toContain('$50.00 / $100.00')
    })

    it('should show "over" when current budget is exceeded', () => {
      const overBudgetCategory = {
        ...mockCategoryOption,
        actualAmount: 120,
        remainingAmount: -20,
      }

      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: null,
          currency: 'USD',
          categoryOption: overBudgetCategory,
        },
      })

      expect(wrapper.text()).toContain('$20.00 over')
    })

    it('should apply correct color classes for current budget state', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: null,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const progressBar = wrapper.findComponent({ name: 'QLinearProgress' })
      expect(progressBar.props('color')).toBe('primary')
    })

    it('should show amount is 0 when category selected but amount is 0', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 0,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('Remaining:')
      expect(wrapper.text()).toContain('Enter an amount to see the impact on this budget')
    })
  })

  describe('Full Impact State', () => {
    it('should show full impact analysis when category and amount are provided', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('Current:')
      expect(wrapper.text()).toContain('Adding:')
      expect(wrapper.text()).toContain('After:')
    })

    it('should calculate and display new spent amount correctly', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('75% used')
      expect(wrapper.text()).toContain('$75.00 / $100.00')
      expect(wrapper.text()).toContain('+$25.00')
      expect(wrapper.text()).toContain('$25.00 left')
    })

    it('should show "over" when new expense exceeds budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 60,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('$10.00 over')
    })

    it('should display checkmark icon when within budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const icons = wrapper.findAllComponents({ name: 'QIcon' })
      const statusIcon = icons.find((icon) => icon.props('name') === 'eva-checkmark-circle-outline')
      expect(statusIcon?.exists()).toBe(true)
    })

    it('should display warning icon when approaching budget limit (90-100%)', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 45, // 50 + 45 = 95% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const icons = wrapper.findAllComponents({ name: 'QIcon' })
      const statusIcon = icons.find((icon) =>
        icon.props('name')?.includes('alert-triangle-outline'),
      )
      expect(statusIcon?.exists()).toBe(true)
    })

    it('should display alert icon when over budget (>100%)', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 55, // 50 + 55 = 105% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const icons = wrapper.findAllComponents({ name: 'QIcon' })
      const statusIcon = icons.find((icon) => icon.props('name')?.includes('alert-circle-outline'))
      expect(statusIcon?.exists()).toBe(true)
    })

    it('should apply primary color when under 100% budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const progressBar = wrapper.findComponent({ name: 'QLinearProgress' })
      expect(progressBar.props('color')).toBe('primary')
    })

    it('should apply positive color when exactly at 100% budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 50,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const progressBar = wrapper.findComponent({ name: 'QLinearProgress' })
      expect(progressBar.props('color')).toBe('positive')
    })

    it('should apply warning color when 90-100% of budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 45, // 50 + 45 = 95% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const progressBar = wrapper.findComponent({ name: 'QLinearProgress' })
      expect(progressBar.props('color')).toBe('warning')
    })

    it('should apply negative color when over 100% of budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 55, // 50 + 55 = 105% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const progressBar = wrapper.findComponent({ name: 'QLinearProgress' })
      expect(progressBar.props('color')).toBe('negative')
    })
  })

  describe('Card Background Colors', () => {
    it('should have no background color when under budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const card = wrapper.findComponent({ name: 'QCard' })
      expect(card.classes()).not.toContain('bg-orange-1')
      expect(card.classes()).not.toContain('bg-red-1')
    })

    it('should have orange background when 90-100% of budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 45, // 50 + 45 = 95% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const card = wrapper.findComponent({ name: 'QCard' })
      expect(card.classes()).toContain('bg-orange-1')
    })

    it('should have red background when over 100% of budget', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 55, // 50 + 55 = 105% of budget
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      const card = wrapper.findComponent({ name: 'QCard' })
      expect(card.classes()).toContain('bg-red-1')
    })

    it('should use current budget percentage for background when no amount', () => {
      const overBudgetCategory = {
        ...mockCategoryOption,
        actualAmount: 120,
        remainingAmount: -20,
      }

      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: null,
          currency: 'USD',
          categoryOption: overBudgetCategory,
        },
      })

      const card = wrapper.findComponent({ name: 'QCard' })
      expect(card.classes()).toContain('bg-red-1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero planned amount gracefully', () => {
      const zeroBudgetCategory = {
        ...mockCategoryOption,
        plannedAmount: 0,
        actualAmount: 0,
        remainingAmount: 0,
      }

      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: 'USD',
          categoryOption: zeroBudgetCategory,
        },
      })

      expect(wrapper.text()).toContain('0% used')
    })

    it('should cap percentage at 999 to prevent overflow', () => {
      const smallBudgetCategory = {
        ...mockCategoryOption,
        plannedAmount: 1,
        actualAmount: 0,
        remainingAmount: 1,
      }

      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 5000,
          currency: 'USD',
          categoryOption: smallBudgetCategory,
        },
      })

      // The percentage should be capped at 999
      expect(wrapper.text()).toContain('999% used')
    })

    it('should fallback to USD when currency is null', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: 25,
          currency: null,
          categoryOption: mockCategoryOption,
        },
      })

      expect(wrapper.text()).toContain('$')
    })

    it('should handle negative amounts gracefully', () => {
      const wrapper = mount(BudgetImpactCard, {
        props: {
          ...defaultProps,
          categoryId: 'cat-1',
          amount: -10,
          currency: 'USD',
          categoryOption: mockCategoryOption,
        },
      })

      // Negative amounts should show the current budget state
      expect(wrapper.text()).toContain('Remaining:')
      expect(wrapper.text()).toContain('Enter an amount to see the impact on this budget')
    })
  })
})
