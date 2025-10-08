import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanInformationForm from './PlanInformationForm.vue'

installQuasarPlugin()

vi.mock('src/utils/plans', () => ({
  calculateEndDate: vi.fn((startDate: Date, duration: string) => {
    const endDate = new Date(startDate)
    if (duration === 'weekly') endDate.setDate(endDate.getDate() + 7)
    else if (duration === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else if (duration === 'yearly') endDate.setFullYear(endDate.getFullYear() + 1)
    return endDate
  }),
}))

type PlanInformationFormProps = ComponentProps<typeof PlanInformationForm>

const renderPlanInformationForm = (props: PlanInformationFormProps) => {
  return mount(PlanInformationForm, {
    props,
    global: {
      stubs: {
        SectionHeader: { template: '<div class="section-header"><slot /></div>' },
        'q-card': { template: '<div><slot /></div>' },
        'q-input': {
          template:
            '<div class="q-input"><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
          props: ['modelValue', 'label', 'outlined', 'readonly', 'rules'],
          emits: ['update:modelValue'],
        },
        'q-icon': { template: '<i />' },
        'q-popup-proxy': { template: '<div><slot /></div>' },
        'q-date': {
          template: '<div class="q-date" />',
          props: ['modelValue', 'mask'],
          emits: ['update:modelValue'],
        },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['label', 'color', 'flat'],
        },
      },
    },
  })
}

describe('PlanInformationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: '', startDate: '', endDate: '' },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display current form values', () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: 'Test Plan', startDate: '2024-01-01', endDate: '2024-01-31' },
    })

    const inputs = wrapper.findAll('.q-input input')
    expect((inputs[0]?.element as HTMLInputElement).value).toBe('Test Plan')
    expect((inputs[1]?.element as HTMLInputElement).value).toBe('2024-01-01')
    expect((inputs[2]?.element as HTMLInputElement).value).toBe('2024-01-31')
  })

  it('should emit update when name changes', async () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: '', startDate: '', endDate: '' },
    })

    const inputs = wrapper.findAll('.q-input input')
    await inputs[0]?.setValue('New Plan')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue') as unknown[][]
    expect(emitted[0]?.[0]).toEqual({ name: 'New Plan', startDate: '', endDate: '' })
  })

  it('should emit update when start date changes', async () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: 'Test', startDate: '', endDate: '' },
    })

    const inputs = wrapper.findAll('.q-input input')
    await inputs[1]?.setValue('2024-01-01')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should auto-calculate end date when template duration provided', async () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: 'Test', startDate: '', endDate: '' },
      templateDuration: 'monthly',
    })

    const inputs = wrapper.findAll('.q-input input')
    await inputs[1]?.setValue('2024-01-01')

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue') as unknown[][]
    const lastEmit = emitted[emitted.length - 1]?.[0] as {
      name: string
      startDate: string
      endDate: string
    }
    expect(lastEmit.endDate).toBeTruthy()
  })

  it('should use default props', () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: '', startDate: '', endDate: '' },
    })

    expect(wrapper.props('templateDuration')).toBe('')
    expect(wrapper.props('readonly')).toBe(false)
  })

  it('should respect readonly prop', () => {
    const wrapper = renderPlanInformationForm({
      modelValue: { name: 'Test', startDate: '2024-01-01', endDate: '2024-01-31' },
      readonly: true,
    })

    expect(wrapper.props('readonly')).toBe(true)
  })
})
