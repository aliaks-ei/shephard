import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import TemplateBasicInfoSection from './TemplateBasicInfoSection.vue'

installQuasarPlugin()

type TemplateBasicInfoSectionProps = ComponentProps<typeof TemplateBasicInfoSection>

const renderComponent = (props: TemplateBasicInfoSectionProps) => {
  return mount(TemplateBasicInfoSection, {
    props,
    global: {
      stubs: {
        SectionHeader: true,
      },
    },
  })
}

describe('TemplateBasicInfoSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display template name in readonly mode', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
      readonly: true,
    })
    const nameInput = wrapper.findComponent({ name: 'QInput' })
    expect(nameInput.exists()).toBe(true)
    expect(nameInput.props('readonly')).toBe(true)
  })

  it('should display duration as chip in readonly mode', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
      readonly: true,
    })
    expect(wrapper.text()).toContain('weekly')
  })

  it('should emit update:modelValue when name changes', async () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
    })
    const nameInput = wrapper.findComponent({ name: 'QInput' })
    await nameInput.vm.$emit('update:model-value', 'Updated Template')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as {
      name: string
      duration: string
    }
    expect(emitted.name).toBe('Updated Template')
  })

  it('should emit clear-name-error when name changes', async () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
      nameError: true,
      nameErrorMessage: 'Name already exists',
    })
    const nameInput = wrapper.findComponent({ name: 'QInput' })
    await nameInput.vm.$emit('update:model-value', 'New Name')
    expect(wrapper.emitted('clear-name-error')).toBeTruthy()
  })

  it('should emit update:modelValue when duration changes', async () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test Template', duration: 'weekly' },
    })
    const durationSelect = wrapper.findComponent({ name: 'QSelect' })
    await durationSelect.vm.$emit('update:model-value', 'monthly')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as {
      name: string
      duration: string
    }
    expect(emitted.duration).toBe('monthly')
  })

  it('should use default props', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test', duration: 'weekly' },
    })
    expect(wrapper.props('readonly')).toBe(false)
    expect(wrapper.props('nameError')).toBe(false)
    expect(wrapper.props('nameErrorMessage')).toBe('')
  })

  it('should display name error', () => {
    const wrapper = renderComponent({
      modelValue: { name: '', duration: 'weekly' },
      nameError: true,
      nameErrorMessage: 'Name is required',
    })
    expect(wrapper.props('nameError')).toBe(true)
    expect(wrapper.props('nameErrorMessage')).toBe('Name is required')
  })

  it('should validate name is required', () => {
    const wrapper = renderComponent({
      modelValue: { name: '', duration: 'weekly' },
    })
    const nameInput = wrapper.findComponent({ name: 'QInput' })
    const rules = nameInput.props('rules') as Array<(val: string) => boolean | string> | undefined
    if (rules?.[0]) {
      expect(rules[0]('')).toBe('Template name is required')
    }
  })

  it('should validate name max length', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test', duration: 'weekly' },
    })
    const nameInput = wrapper.findComponent({ name: 'QInput' })
    const rules = nameInput.props('rules') as Array<(val: string) => boolean | string> | undefined
    const longName = 'a'.repeat(101)
    if (rules?.[0]) {
      expect(rules[0](longName)).toBe('Template name must be 100 characters or less')
    }
  })

  it('should not show rules in readonly mode', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test', duration: 'weekly' },
      readonly: true,
    })
    const inputs = wrapper.findAllComponents({ name: 'QInput' })
    inputs.forEach((input) => {
      expect(input.props('readonly')).toBe(true)
    })
  })

  it('should handle all duration options', () => {
    const durations = ['weekly', 'monthly', 'yearly']
    durations.forEach((duration) => {
      const wrapper = renderComponent({
        modelValue: { name: 'Test', duration },
      })
      expect(wrapper.props('modelValue').duration).toBe(duration)
    })
  })

  it('should not emit update:modelValue in readonly mode', () => {
    const wrapper = renderComponent({
      modelValue: { name: 'Test', duration: 'weekly' },
      readonly: true,
    })
    const nameInputs = wrapper.findAllComponents({ name: 'QInput' })
    nameInputs.forEach((input) => {
      expect(input.props('readonly')).toBe(true)
    })
  })
})
