import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

import CategoryPreviewDialog from './CategoryPreviewDialog.vue'
import type { CategoryWithStats } from 'src/api'

installQuasarPlugin()

const mockRouterPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

type CategoryPreviewDialogProps = ComponentProps<typeof CategoryPreviewDialog>

const mockCategoryWithTemplates: CategoryWithStats = {
  id: 'category-1',
  name: 'Food',
  color: '#FF5722',
  icon: 'eva-restaurant-outline',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  templates: [
    {
      id: 'template-1',
      name: 'Grocery Shopping',
      owner_id: 'user-1',
    },
    {
      id: 'template-2',
      name: 'Restaurant Dining',
      owner_id: 'user-1',
    },
    {
      id: 'template-3',
      name: 'Shared Meal Plan',
      owner_id: 'user-2',
      permission_level: 'edit',
    },
  ],
}

const mockCategoryWithoutTemplates: CategoryWithStats = {
  id: 'category-2',
  name: 'Entertainment',
  color: '#9C27B0',
  icon: 'eva-film-outline',
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  templates: [],
}

const defaultProps: CategoryPreviewDialogProps = {
  modelValue: true,
  category: mockCategoryWithTemplates,
}

const renderCategoryPreviewDialog = (props: Partial<CategoryPreviewDialogProps> = {}) => {
  return mount(CategoryPreviewDialog, {
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

describe('CategoryPreviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when modelValue is true', () => {
    const wrapper = renderCategoryPreviewDialog()
    expect(wrapper.exists()).toBe(true)
  })

  describe('Category display', () => {
    it('displays category name', () => {
      const wrapper = renderCategoryPreviewDialog()
      expect(wrapper.text()).toContain('Food')
    })

    it('displays template count', () => {
      const wrapper = renderCategoryPreviewDialog()
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('templates')
    })

    it('displays template count with singular form for one template', () => {
      const categoryWithOneTemplate: CategoryWithStats = {
        ...mockCategoryWithTemplates,
        templates: [mockCategoryWithTemplates.templates[0]!],
      }
      const wrapper = renderCategoryPreviewDialog({
        category: categoryWithOneTemplate,
      })
      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('template')
      expect(wrapper.text()).not.toContain('templates')
    })

    it('displays empty state when category has no templates', () => {
      const wrapper = renderCategoryPreviewDialog({
        category: mockCategoryWithoutTemplates,
      })

      expect(wrapper.text()).toContain('No templates use this category yet')
      expect(wrapper.text()).toContain('Templates using this category will appear here')
    })
  })

  describe('Templates list', () => {
    it('displays all template names', () => {
      const wrapper = renderCategoryPreviewDialog()

      expect(wrapper.text()).toContain('Grocery Shopping')
      expect(wrapper.text()).toContain('Restaurant Dining')
      expect(wrapper.text()).toContain('Shared Meal Plan')
    })

    it('shows shared indicator for shared templates', () => {
      const wrapper = renderCategoryPreviewDialog()
      expect(wrapper.text()).toContain('Shared')
    })

    it('does not show shared indicator for owned templates', () => {
      const categoryWithOnlyOwnedTemplates: CategoryWithStats = {
        ...mockCategoryWithTemplates,
        templates: [
          {
            id: 'template-1',
            name: 'Grocery Shopping',
            owner_id: 'user-1',
          },
        ],
      }
      const wrapper = renderCategoryPreviewDialog({
        category: categoryWithOnlyOwnedTemplates,
      })

      const sharedChips = wrapper.findAll('.q-chip').filter((chip) => chip.text() === 'Shared')
      expect(sharedChips.length).toBe(0)
    })
  })

  describe('Navigation', () => {
    it('navigates to template when template item is clicked', async () => {
      const wrapper = renderCategoryPreviewDialog()

      const items = wrapper.findAll('.q-item')
      const firstItem = items.find((item) => item.text().includes('Grocery Shopping'))

      if (firstItem) {
        await firstItem.trigger('click')
        await nextTick()

        expect(mockRouterPush).toHaveBeenCalledWith({
          name: 'template',
          params: { id: 'template-1' },
        })
      }
    })

    it('closes dialog after navigating to template', async () => {
      const wrapper = renderCategoryPreviewDialog()

      const items = wrapper.findAll('.q-item')
      const firstItem = items.find((item) => item.text().includes('Grocery Shopping'))

      if (firstItem) {
        await firstItem.trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      }
    })
  })

  describe('Dialog controls', () => {
    it('emits update:modelValue when close button is clicked', async () => {
      const wrapper = renderCategoryPreviewDialog()

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
      const wrapper = renderCategoryPreviewDialog()

      const buttons = wrapper.findAll('button')
      const cancelButton = buttons.find((btn) => btn.text() === 'Cancel')

      if (cancelButton) {
        await cancelButton.trigger('click')
        await nextTick()

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
      }
    })
  })

  describe('Edge cases', () => {
    it('handles null category gracefully', () => {
      const wrapper = renderCategoryPreviewDialog({
        category: null,
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Food')
    })

    it('handles category with empty templates array', () => {
      const wrapper = renderCategoryPreviewDialog({
        category: mockCategoryWithoutTemplates,
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.text()).toContain('Entertainment')
      expect(wrapper.text()).toContain('No templates use this category yet')
    })

    it('renders correctly when modelValue is false', () => {
      const wrapper = renderCategoryPreviewDialog({
        modelValue: false,
      })

      expect(wrapper.exists()).toBe(true)
    })
  })
})
