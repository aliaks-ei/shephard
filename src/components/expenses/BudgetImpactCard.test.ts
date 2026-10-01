import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import BudgetImpactCard from './BudgetImpactCard.vue'

installQuasarPlugin()

const categoryOption = {
  label: 'Food',
  value: 'cat-1',
  color: '#22c55e',
  icon: 'eva-shopping-cart-outline',
  plannedAmount: 100,
  actualAmount: 50,
  remainingAmount: 50,
}

const render = (amount: number | null) =>
  mount(BudgetImpactCard, {
    props: { categoryId: 'cat-1', amount, currency: 'USD', categoryOption },
  })

describe('BudgetImpactCard', () => {
  it('says what is left in the category after this expense', () => {
    const wrapper = render(20)

    expect(wrapper.text()).toContain('$30.00')
    expect(wrapper.text()).toContain('left in Food after this')
    expect(wrapper.find('.budget-impact--over').exists()).toBe(false)
  })

  it('says how much over when the expense passes the budget', () => {
    const wrapper = render(70)

    expect(wrapper.text()).toContain('$20.00')
    expect(wrapper.text()).toContain('over in Food after this')
    expect(wrapper.find('.budget-impact--over').exists()).toBe(true)
  })

  it('renders nothing without an amount', () => {
    expect(render(null).find('.budget-impact').exists()).toBe(false)
    expect(render(0).find('.budget-impact').exists()).toBe(false)
  })
})
