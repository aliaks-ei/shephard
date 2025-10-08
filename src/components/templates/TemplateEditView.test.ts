import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import TemplateEditView from './TemplateEditView.vue'
import { createMockCategories } from 'test/fixtures'
import type { TemplateItemUI } from 'src/types'

installQuasarPlugin()

type TemplateEditViewProps = ComponentProps<typeof TemplateEditView>

const mockCategoryGroups = [
  {
    categoryId: 'cat-1',
    categoryName: 'Food',
    categoryColor: '#FF0000',
    categoryIcon: 'eva-pricetags-outline',
    subtotal: 8,
    items: [
      { id: 'item-1', name: 'Milk', categoryId: 'cat-1', amount: 5, color: '#FF0000' },
      { id: 'item-2', name: 'Bread', categoryId: 'cat-1', amount: 3, color: '#FF0000' },
    ] as TemplateItemUI[],
  },
]

const mockSetCategoryRef = vi.fn()

const renderComponent = (props: TemplateEditViewProps) => {
  return mount(TemplateEditView, {
    props,
    global: {
      stubs: {
        TemplateBasicInfoSection: true,
        CategoryItemsManager: true,
        TemplateCategory: true,
      },
    },
  })
}

describe('TemplateEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderComponent({
      form: { name: 'Test Template', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should expose formRef', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    expect(wrapper.vm.formRef).toBeDefined()
  })

  it('should emit submit event when form is submitted', async () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const form = wrapper.find('form')
    await form.trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })

  it('should emit update:form when form data changes', async () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const basicInfo = wrapper.findComponent({ name: 'TemplateBasicInfoSection' })
    await basicInfo.vm.$emit('update:model-value', { name: 'Updated', duration: 'monthly' })
    expect(wrapper.emitted('update:form')).toBeTruthy()
    expect(wrapper.emitted('update:form')?.[0]).toEqual([{ name: 'Updated', duration: 'monthly' }])
  })

  it('should emit clear-name-error when triggered', async () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: true,
      nameErrorMessage: 'Error',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const basicInfo = wrapper.findComponent({ name: 'TemplateBasicInfoSection' })
    await basicInfo.vm.$emit('clear-name-error')
    expect(wrapper.emitted('clear-name-error')).toBeTruthy()
  })

  it('should emit toggle-expand when triggered', async () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    await manager.vm.$emit('toggle-expand')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('should emit open-category-dialog when triggered', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    wrapper.vm.$emit('open-category-dialog')
    expect(wrapper.emitted('open-category-dialog')).toBeTruthy()
  })

  it('should emit update-item when item is updated', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const updatedItem = {
      id: 'item-1',
      name: 'Updated Milk',
      categoryId: 'cat-1',
      amount: 10,
      color: '#FF0000',
    }
    wrapper.vm.$emit('update-item', 'item-1', updatedItem)
    expect(wrapper.emitted('update-item')).toBeTruthy()
    expect(wrapper.emitted('update-item')?.[0]).toEqual(['item-1', updatedItem])
  })

  it('should emit remove-item when item is removed', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    wrapper.vm.$emit('remove-item', 'item-1')
    expect(wrapper.emitted('remove-item')).toBeTruthy()
    expect(wrapper.emitted('remove-item')?.[0]).toEqual(['item-1'])
  })

  it('should emit add-item when item is added', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    wrapper.vm.$emit('add-item', 'cat-1', '#FF0000')
    expect(wrapper.emitted('add-item')).toBeTruthy()
    expect(wrapper.emitted('add-item')?.[0]).toEqual(['cat-1', '#FF0000'])
  })

  it('should pass hasDuplicates prop to CategoryItemsManager', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: mockCategoryGroups,
      categories: createMockCategories(),
      totalAmount: 100,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: true,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const manager = wrapper.findComponent({ name: 'CategoryItemsManager' })
    expect(manager.props('hasDuplicates')).toBe(true)
  })

  it('should pass name error props to TemplateBasicInfoSection', () => {
    const wrapper = renderComponent({
      form: { name: 'Test', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: true,
      nameErrorMessage: 'Template name already exists',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    const basicInfo = wrapper.findComponent({ name: 'TemplateBasicInfoSection' })
    expect(basicInfo.props('nameError')).toBe(true)
    expect(basicInfo.props('nameErrorMessage')).toBe('Template name already exists')
  })

  it('should handle empty category groups', () => {
    const wrapper = renderComponent({
      form: { name: 'Empty', duration: 'weekly' },
      categoryGroups: [],
      categories: [],
      totalAmount: 0,
      currency: 'USD',
      allExpanded: false,
      hasDuplicates: false,
      nameError: false,
      nameErrorMessage: '',
      lastAddedCategoryId: null,
      setCategoryRef: mockSetCategoryRef,
    })
    expect(wrapper.exists()).toBe(true)
  })
})
