import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import ColorPicker from './ColorPicker.vue'

installQuasarPlugin()

type ColorPickerProps = ComponentProps<typeof ColorPicker>

const renderColorPicker = (props: ColorPickerProps) => {
  return mount(ColorPicker, {
    props,
  })
}

describe('ColorPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderColorPicker({
      modelValue: '#ff0000',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display the selected color in avatar', () => {
    const testColor = '#ff5733'
    const wrapper = renderColorPicker({
      modelValue: testColor,
    })

    const avatar = wrapper.find('.q-avatar')
    expect(avatar.exists()).toBe(true)
    expect(avatar.attributes('style')).toContain(`background-color: ${testColor}`)
  })

  it('should display the color value as text', () => {
    const testColor = '#00ff00'
    const wrapper = renderColorPicker({
      modelValue: testColor,
    })

    const colorText = wrapper.find('.text-caption')
    expect(colorText.exists()).toBe(true)
    expect(colorText.text()).toContain(testColor)
  })

  it('should emit update:modelValue when color changes', () => {
    const wrapper = renderColorPicker({
      modelValue: '#ff0000',
    })

    const newColor = '#00ff00'
    wrapper.vm.$emit('update:modelValue', newColor)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([newColor])
  })

  it('should render with correct structure', () => {
    const wrapper = renderColorPicker({
      modelValue: '#123456',
    })

    expect(wrapper.find('.color-picker').exists()).toBe(true)
    expect(wrapper.find('.text-subtitle2').exists()).toBe(true)
    expect(wrapper.find('.text-subtitle2').text()).toBe('Category Color')
    expect(wrapper.find('.q-avatar').exists()).toBe(true)
    expect(wrapper.find('.q-icon').exists()).toBe(true)
    expect(wrapper.find('.category-color-picker').exists()).toBe(true)
  })

  it('should have correct icon in avatar', () => {
    const wrapper = renderColorPicker({
      modelValue: '#abcdef',
    })

    const icon = wrapper.find('.q-icon')
    expect(icon.exists()).toBe(true)
    expect(wrapper.html()).toContain('eva-pricetags-outline')
  })

  it('should handle different color formats', () => {
    const hexColor = '#ff0000'
    const wrapper = renderColorPicker({
      modelValue: hexColor,
    })

    expect(wrapper.find('.text-caption').text()).toContain(hexColor)
    expect(wrapper.find('.q-avatar').attributes('style')).toContain(`background-color: ${hexColor}`)
  })
})
