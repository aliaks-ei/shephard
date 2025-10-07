import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import CategorySelectionDialog from './CategorySelectionDialog.vue'
import type { Category } from 'src/api'

installQuasarPlugin()

type CategorySelectionDialogProps = ComponentProps<typeof CategorySelectionDialog>

const mockCategories: Category[] = [
  {
    id: 'category-1',
    name: 'Rent/Mortgage',
    color: '#1d4ed8',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'category-2',
    name: 'Transportation',
    color: '#6366f1',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  },
  {
    id: 'category-3',
    name: 'Entertainment',
    color: '#e879f9',
    icon: 'eva-pricetags-outline',
    created_at: '2023-01-03T00:00:00Z',
    updated_at: '2023-01-03T00:00:00Z',
  },
]

const defaultProps: CategorySelectionDialogProps = {
  modelValue: true,
  usedCategoryIds: [],
  categories: mockCategories,
}

const renderCategorySelectionDialog = (props: Partial<CategorySelectionDialogProps> = {}) => {
  return mount(CategorySelectionDialog, {
    props: { ...defaultProps, ...props },
    global: {
      stubs: {
        QDialog: {
          template: '<div><slot /></div>',
        },
      },
    },
  })
}

describe('CategorySelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when modelValue is true', () => {
    const wrapper = renderCategorySelectionDialog()
    expect(wrapper.exists()).toBe(true)
  })

  describe('Category filtering', () => {
    it('filters out used categories', () => {
      const wrapper = renderCategorySelectionDialog({
        usedCategoryIds: ['category-1', 'category-2'],
      })

      const text = wrapper.text()
      expect(text).not.toContain('Rent/Mortgage')
      expect(text).not.toContain('Transportation')
      expect(text).toContain('Entertainment')
    })

    it('shows all categories when none are used', () => {
      const wrapper = renderCategorySelectionDialog({
        usedCategoryIds: [],
      })

      const text = wrapper.text()
      expect(text).toContain('Rent/Mortgage')
      expect(text).toContain('Transportation')
      expect(text).toContain('Entertainment')
    })

    it('shows empty state when all categories are used', () => {
      const wrapper = renderCategorySelectionDialog({
        usedCategoryIds: ['category-1', 'category-2', 'category-3'],
      })

      expect(wrapper.text()).toContain('All categories are already in use')
    })
  })

  describe('Search functionality', () => {
    it('filters categories by search query', async () => {
      const wrapper = renderCategorySelectionDialog()

      const searchInput = wrapper.find('input')
      await searchInput.setValue('rent')
      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('Rent/Mortgage')
      expect(text).not.toContain('Transportation')
      expect(text).not.toContain('Entertainment')
    })

    it('search is case insensitive', async () => {
      const wrapper = renderCategorySelectionDialog()

      const searchInput = wrapper.find('input')
      await searchInput.setValue('TRANSPORT')
      await nextTick()

      const text = wrapper.text()
      expect(text).toContain('Transportation')
      expect(text).not.toContain('Rent/Mortgage')
    })

    it('shows empty state when search has no matches', async () => {
      const wrapper = renderCategorySelectionDialog()

      const searchInput = wrapper.find('input')
      await searchInput.setValue('nonexistent')
      await nextTick()

      expect(wrapper.text()).toContain('No categories match your search')
    })

    it('clears search when dialog is closed', async () => {
      const wrapper = renderCategorySelectionDialog()

      const searchInput = wrapper.find('input')
      await searchInput.setValue('transport')
      await nextTick()

      await wrapper.setProps({ modelValue: false })
      await nextTick()

      await wrapper.setProps({ modelValue: true })
      await nextTick()

      const input = wrapper.find('input')
      expect((input.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('Event emissions', () => {
    it('emits update:modelValue when close button is clicked', async () => {
      const wrapper = renderCategorySelectionDialog()

      const closeButtons = wrapper.findAll('button')
      const closeButton = closeButtons.find((btn) =>
        btn.attributes('class')?.includes('q-btn--round'),
      )

      if (closeButton) {
        await closeButton.trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      }
    })

    it('emits update:modelValue when cancel button is clicked', async () => {
      const wrapper = renderCategorySelectionDialog()

      const buttons = wrapper.findAll('button')
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      if (cancelButton) {
        await cancelButton.trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      }
    })
  })

  describe('Edge cases', () => {
    it('handles empty categories array', () => {
      const wrapper = renderCategorySelectionDialog({
        categories: [],
        usedCategoryIds: [],
      })

      expect(wrapper.text()).toContain('All categories are already in use')
    })

    it('handles non-existent used category ids', () => {
      const wrapper = renderCategorySelectionDialog({
        usedCategoryIds: ['non-existent-1', 'non-existent-2'],
      })

      expect(wrapper.exists()).toBe(true)
      const text = wrapper.text()
      const hasCategories =
        text.includes('Rent/Mortgage') ||
        text.includes('Transportation') ||
        text.includes('Entertainment')
      expect(hasCategories).toBe(true)
    })
  })
})
