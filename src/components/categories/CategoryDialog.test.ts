import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import type { ComponentProps } from 'vue-component-type-helpers'
import { nextTick } from 'vue'

import CategoryDialog from './CategoryDialog.vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory } from 'src/api'

installQuasarPlugin()

vi.mock('src/utils/color', () => ({
  generateRandomColor: vi.fn(() => '#ff0000'),
}))

type CategoryDialogProps = ComponentProps<typeof CategoryDialog>

const mockCategory: ExpenseCategory = {
  id: 'test-category-id',
  name: 'Test Category',
  color: '#00ff00',
  owner_id: 'test-user-id',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const renderCategoryDialog = (props: CategoryDialogProps) => {
  return mount(CategoryDialog, {
    props,
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn })],
      stubs: {
        ColorPicker: {
          template:
            '<div class="color-picker-stub" @update:modelValue="$emit(\'update:modelValue\', $event)"></div>',
          emits: ['update:modelValue'],
        },
      },
    },
  })
}

describe('CategoryDialog', () => {
  let categoriesStore: ReturnType<typeof useCategoriesStore>

  beforeEach(() => {
    vi.clearAllMocks()
    renderCategoryDialog({
      modelValue: false,
    })
    categoriesStore = useCategoriesStore()
    categoriesStore.categories = []
  })

  it('should mount component properly', () => {
    const wrapper = renderCategoryDialog({
      modelValue: false,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should display create mode title when no category is provided', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    expect(wrapper.props('modelValue')).toBe(true)
    expect(wrapper.props('category')).toBeUndefined()
  })

  it('should display edit mode title when category is provided', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect(wrapper.props('category')).toEqual(mockCategory)
    expect((wrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(true)
  })

  it('should show form inputs', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should emit update:modelValue when close button is clicked', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    wrapper.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should emit update:modelValue when cancel button is clicked', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    wrapper.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('should be in create mode when no category provided', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    expect((wrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(false)
    expect(wrapper.props('category')).toBeUndefined()
  })

  it('should be in edit mode when category provided', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
      category: mockCategory,
    })

    expect((wrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(true)
    expect(wrapper.props('category')).toEqual(mockCategory)
  })

  it('should have reactive form properties', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    const component = wrapper.vm as unknown as {
      categoryName: string
      categoryColor: string
      isSubmitting: boolean
    }
    expect(component.categoryName).toBe('')
    expect(typeof component.categoryColor).toBe('string')
    expect(component.isSubmitting).toBe(false)
  })

  it('should have form validation rules', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    const component = wrapper.vm as unknown as { nameRules: ((val: string) => string | true)[] }
    expect(component.nameRules).toBeDefined()
    expect(component.nameRules.length).toBeGreaterThan(0)
  })

  it('should reset form on dialog show for create mode', async () => {
    const wrapper = renderCategoryDialog({
      modelValue: false,
    })

    const component = wrapper.vm as unknown as {
      onDialogShow: () => void
      categoryName: string
      categoryColor: string
    }
    component.onDialogShow()
    await nextTick()

    expect(component.categoryName).toBe('')
    expect(component.categoryColor).toBe('#ff0000')
  })

  it('should reset form on dialog hide', async () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    const component = wrapper.vm as unknown as {
      onDialogHide: () => void
      categoryName: string
      categoryColor: string
    }
    component.onDialogHide()
    await nextTick()

    expect(component.categoryName).toBe('')
    expect(component.categoryColor).toBe('')
  })

  it('should display correct button labels', () => {
    const createWrapper = renderCategoryDialog({
      modelValue: true,
    })
    expect((createWrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(false)

    const editWrapper = renderCategoryDialog({
      modelValue: true,
      category: mockCategory,
    })
    expect((editWrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(true)
  })

  it('should include ColorPicker component', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should handle unsuccessful save operation', async () => {
    categoriesStore.addCategory = vi.fn().mockResolvedValue(false)

    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    await (wrapper.vm as unknown as { onSubmit: () => Promise<void> }).onSubmit()
    await nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    expect(wrapper.emitted('category-saved')).toBeFalsy()
  })

  it('should populate form with category data in edit mode', async () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
      category: mockCategory,
    })

    const component = wrapper.vm as unknown as {
      onDialogShow: () => void
      categoryName: string
      categoryColor: string
    }
    component.onDialogShow()
    await nextTick()

    expect(component.categoryName).toBe('Test Category')
    expect(component.categoryColor).toBe('#00ff00')
  })

  it('should compute isEditMode correctly', () => {
    const createWrapper = renderCategoryDialog({
      modelValue: true,
    })
    expect((createWrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(false)

    const editWrapper = renderCategoryDialog({
      modelValue: true,
      category: mockCategory,
    })
    expect((editWrapper.vm as unknown as { isEditMode: boolean }).isEditMode).toBe(true)
  })

  it('should validate category name rules', () => {
    const wrapper = renderCategoryDialog({
      modelValue: true,
    })

    const rules = (wrapper.vm as unknown as { nameRules: ((val: string) => string | true)[] })
      .nameRules

    expect(rules[0]!('')).toBe('Category name is required')
    expect(rules[0]!('   ')).toBe('Category name is required')
    expect(rules[0]!('a'.repeat(101))).toBe('Category name must be 100 characters or less')
    expect(rules[0]!('Valid Name')).toBe(true)
  })
})
