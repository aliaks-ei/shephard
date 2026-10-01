import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import CategoryBudgetListItem from './CategoryBudgetListItem.vue'
import type { CategoryBudget } from 'src/types'

installQuasarPlugin()

const category = (overrides: Partial<CategoryBudget>): CategoryBudget => ({
  categoryId: 'cat-1',
  categoryName: 'Entertainment',
  categoryColor: '#e879f9',
  categoryIcon: 'eva-tv-outline',
  plannedAmount: 25,
  actualAmount: 10,
  remainingAmount: 15,
  expenseCount: 1,
  ...overrides,
})

const render = (overrides: Partial<CategoryBudget>) =>
  mount(CategoryBudgetListItem, { props: { category: category(overrides), currency: 'USD' } })

describe('CategoryBudgetListItem', () => {
  it('shows what is left while under budget', () => {
    expect(render({}).text()).toContain('$15.00 left')
  })

  it('shows the overspend and a red tail even when remaining reports zero', () => {
    const wrapper = render({ actualAmount: 25.98, remainingAmount: 0 })

    expect(wrapper.text()).toContain('$0.98 over')
    expect(wrapper.find('.category-budget-row__overflow').exists()).toBe(true)
  })

  it('shows All used when the budget is spent exactly', () => {
    const wrapper = render({ actualAmount: 25, remainingAmount: 0 })

    expect(wrapper.text()).toContain('All used')
    expect(wrapper.find('.category-budget-row__overflow').exists()).toBe(false)
  })
})
