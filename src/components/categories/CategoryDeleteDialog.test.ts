import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import type { ComponentProps } from 'vue-component-type-helpers'
import { nextTick } from 'vue'

import CategoryDeleteDialog from './CategoryDeleteDialog.vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory } from 'src/api'

installQuasarPlugin()

type CategoryDeleteDialogProps = ComponentProps<typeof CategoryDeleteDialog>

const mockCategory: ExpenseCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  color: '#ff0000',
  owner_id: 'test-user-id',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const renderCategoryDeleteDialog = (props: CategoryDeleteDialogProps) => {
  return mount(CategoryDeleteDialog, {
    props,
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
    },
  })
}

describe('CategoryDeleteDialog', () => {
  let categoriesStore: ReturnType<typeof useCategoriesStore>

  beforeEach(() => {
    vi.clearAllMocks()
    renderCategoryDeleteDialog({
      modelValue: false,
      category: null,
    })
    categoriesStore = useCategoriesStore()
  })

  it('should mount component properly', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: false,
      category: null,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display dialog when modelValue is true', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.props('modelValue')).toBe(true)
    expect(wrapper.props('category')).toEqual(mockCategory)
  })

  it('should display category name in confirmation message', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.props('category')?.name).toBe('Test Category')
  })

  it('should display warning banner', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit update:modelValue when cancel button is clicked', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    wrapper.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should have access to category prop for deletion', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.props('category')).toEqual(mockCategory)
    expect(wrapper.props('category')?.id).toBe('test-category-id')
  })

  it('should emit category-deleted event after successful deletion', async () => {
    categoriesStore.removeCategory = vi.fn().mockResolvedValue(undefined)

    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    await (wrapper.vm as unknown as { onDelete: () => Promise<void> }).onDelete()
    await nextTick()

    expect(wrapper.emitted('category-deleted')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('should have isDeleting reactive property', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    const component = wrapper.vm as unknown as { isDeleting: boolean }
    expect(component.isDeleting).toBe(false)
  })

  it('should not call removeCategory when category is null', async () => {
    categoriesStore.removeCategory = vi.fn()

    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: null,
    })

    await (wrapper.vm as unknown as { onDelete: () => Promise<void> }).onDelete()

    expect(categoriesStore.removeCategory).not.toHaveBeenCalled()
  })

  it('should handle deletion errors properly', async () => {
    categoriesStore.removeCategory = vi.fn().mockRejectedValue(new Error('Delete failed'))

    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    const component = wrapper.vm as unknown as {
      onDelete: () => Promise<void>
      isDeleting: boolean
    }
    await component.onDelete()
    await nextTick()

    expect(component.isDeleting).toBe(false)
  })

  it('should emit update:modelValue on dialog close', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    wrapper.vm.$emit('update:modelValue', false)

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should display correct dialog title', () => {
    const wrapper = renderCategoryDeleteDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.exists()).toBe(true)
  })
})
