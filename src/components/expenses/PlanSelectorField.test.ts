import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import PlanSelectorField from './PlanSelectorField.vue'
import type { PlanOption } from './PlanSelectorField.vue'

installQuasarPlugin()

describe('PlanSelectorField', () => {
  const mockPlanOptions: PlanOption[] = [
    {
      label: 'Weekly Grocery',
      value: 'plan-1',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      currency: 'USD',
    },
    {
      label: 'Monthly Budget',
      value: 'plan-2',
      status: 'completed',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      currency: 'EUR',
    },
  ]

  const defaultProps = {
    modelValue: null,
    planOptions: mockPlanOptions,
  }

  it('should mount component properly', () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should display plan select dropdown', () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.exists()).toBe(true)
  })

  it('should emit update:modelValue when plan is selected', async () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    await select.vm.$emit('update:model-value', 'plan-1')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['plan-1'])
  })

  it('should emit plan-selected event when plan is selected', async () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    await select.vm.$emit('update:model-value', 'plan-1')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['plan-1'])
  })

  it('should show auto-select banner when showAutoSelectBanner is true', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        showAutoSelectBanner: true,
      },
    })

    expect(wrapper.text()).toContain('Most recently used plan selected')
  })

  it('should not show auto-select banner by default', () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    expect(wrapper.text()).not.toContain('Most recently used plan selected')
  })

  it('should set readonly attribute when readonly prop is true', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        readonly: true,
      },
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('readonly')).toBe(true)
  })

  it('should set loading state when loading prop is true', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        loading: true,
      },
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('loading')).toBe(true)
  })

  it('should use display value when provided', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        displayValue: 'Custom Display',
      },
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('displayValue')).toBe('Custom Display')
  })

  it('should require plan selection via rules', () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    const rules = select.props('rules') as ((val: string) => boolean | string)[]

    expect(rules).toBeDefined()
    expect(rules[0]?.(null as unknown as string)).toBe('Plan is required')
    expect(rules[0]?.('plan-1')).toBe(true)
  })

  it('should display plan options with dates and status', () => {
    const wrapper = mount(PlanSelectorField, {
      props: defaultProps,
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('options')).toEqual(mockPlanOptions)
  })

  it('should handle null modelValue', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        modelValue: null,
      },
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('modelValue')).toBeNull()
  })

  it('should handle selected plan', () => {
    const wrapper = mount(PlanSelectorField, {
      props: {
        ...defaultProps,
        modelValue: 'plan-1',
      },
    })

    const select = wrapper.findComponent({ name: 'QSelect' })
    expect(select.props('modelValue')).toBe('plan-1')
  })
})
