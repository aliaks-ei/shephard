import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref, nextTick, type Ref } from 'vue'
import { useCategoryRefs } from './useCategoryRefs'
import type { BaseItemUI } from 'src/types'

describe('useCategoryRefs', () => {
  let items: ReturnType<typeof ref<BaseItemUI[]>>

  beforeEach(() => {
    items = ref([
      {
        id: 'item-1',
        categoryId: 'cat-1',
        name: 'Item 1',
        amount: 100,
        color: '#FF0000',
        isFixedPayment: true,
      },
      {
        id: 'item-2',
        categoryId: 'cat-1',
        name: 'Item 2',
        amount: 200,
        color: '#00FF00',
        isFixedPayment: true,
      },
      {
        id: 'item-3',
        categoryId: 'cat-2',
        name: 'Item 3',
        amount: 50,
        color: '#0000FF',
        isFixedPayment: true,
      },
    ])
  })

  describe('setCategoryRef', () => {
    it('stores category ref when element has required methods', () => {
      const { setCategoryRef, focusLastItemInCategory } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )
      const mockFocusLastItem = vi.fn()
      const mockElement = {
        $el: document.createElement('div'),
        focusLastItem: mockFocusLastItem,
        focusFirstInvalidItem: vi.fn(),
      }

      setCategoryRef(mockElement, 'cat-1')
      focusLastItemInCategory('cat-1')

      expect(mockFocusLastItem).toHaveBeenCalled()
    })

    it('removes category ref when element is null', () => {
      const { setCategoryRef, focusLastItemInCategory } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )
      const mockFocusLastItem = vi.fn()
      const mockElement = {
        $el: document.createElement('div'),
        focusLastItem: mockFocusLastItem,
        focusFirstInvalidItem: vi.fn(),
      }

      setCategoryRef(mockElement, 'cat-1')
      setCategoryRef(null, 'cat-1')
      focusLastItemInCategory('cat-1')

      expect(mockFocusLastItem).not.toHaveBeenCalled()
    })

    it('does not store ref when element lacks focusLastItem method', () => {
      const { setCategoryRef, focusLastItemInCategory } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )
      const mockElement = {
        $el: document.createElement('div'),
      }

      setCategoryRef(mockElement, 'cat-1')
      focusLastItemInCategory('cat-1')
    })
  })

  describe('focusLastItemInCategory', () => {
    it('calls focusLastItem when category ref exists', () => {
      const { setCategoryRef, focusLastItemInCategory } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )
      const mockFocusLastItem = vi.fn()
      const mockElement = {
        $el: document.createElement('div'),
        focusLastItem: mockFocusLastItem,
        focusFirstInvalidItem: vi.fn(),
      }

      setCategoryRef(mockElement, 'cat-1')
      focusLastItemInCategory('cat-1')

      expect(mockFocusLastItem).toHaveBeenCalledTimes(1)
    })

    it('does nothing when category ref does not exist', () => {
      const { focusLastItemInCategory } = useCategoryRefs(items as Ref<BaseItemUI[]>)

      focusLastItemInCategory('non-existent')
    })
  })

  describe('scrollToFirstInvalidField', () => {
    it('scrolls to and focuses first invalid item', async () => {
      const { setCategoryRef, scrollToFirstInvalidField, lastAddedCategoryId } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )

      items.value = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: '',
          amount: 100,
          color: '#FF0000',
          isFixedPayment: true,
        },
        {
          id: 'item-2',
          categoryId: 'cat-2',
          name: 'Valid',
          amount: 200,
          color: '#00FF00',
          isFixedPayment: true,
        },
      ]

      const mockScrollIntoView = vi.fn()
      const mockFocusFirstInvalidItem = vi.fn()
      const mockElement = {
        $el: {
          scrollIntoView: mockScrollIntoView,
        } as unknown as HTMLElement,
        focusLastItem: vi.fn(),
        focusFirstInvalidItem: mockFocusFirstInvalidItem,
      }

      setCategoryRef(mockElement, 'cat-1')
      await scrollToFirstInvalidField()
      await nextTick()

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockFocusFirstInvalidItem).toHaveBeenCalled()
      expect(lastAddedCategoryId.value).toBe('cat-1')
    })

    it('handles invalid item with zero amount', async () => {
      const { setCategoryRef, scrollToFirstInvalidField } = useCategoryRefs(
        items as Ref<BaseItemUI[]>,
      )

      items.value = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: 'Valid',
          amount: 0,
          color: '#FF0000',
          isFixedPayment: true,
        },
      ]

      const mockScrollIntoView = vi.fn()
      const mockElement = {
        $el: {
          scrollIntoView: mockScrollIntoView,
        } as unknown as HTMLElement,
        focusLastItem: vi.fn(),
        focusFirstInvalidItem: vi.fn(),
      }

      setCategoryRef(mockElement, 'cat-1')
      await scrollToFirstInvalidField()

      expect(mockScrollIntoView).toHaveBeenCalled()
    })

    it('does nothing when all items are valid', async () => {
      const { scrollToFirstInvalidField } = useCategoryRefs(items as Ref<BaseItemUI[]>)

      items.value = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: 'Valid',
          amount: 100,
          color: '#FF0000',
          isFixedPayment: true,
        },
      ]

      await scrollToFirstInvalidField()
    })

    it('does nothing when category ref does not exist', async () => {
      const { scrollToFirstInvalidField } = useCategoryRefs(items as Ref<BaseItemUI[]>)

      items.value = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: '',
          amount: 100,
          color: '#FF0000',
          isFixedPayment: true,
        },
      ]

      await scrollToFirstInvalidField()
    })
  })

  describe('resetLastAddedCategory', () => {
    it('resets lastAddedCategoryId to null', async () => {
      const {
        setCategoryRef,
        scrollToFirstInvalidField,
        resetLastAddedCategory,
        lastAddedCategoryId,
      } = useCategoryRefs(items as Ref<BaseItemUI[]>)

      items.value = [
        {
          id: 'item-1',
          categoryId: 'cat-1',
          name: '',
          amount: 100,
          color: '#FF0000',
          isFixedPayment: true,
        },
      ]

      const mockElement = {
        $el: {
          scrollIntoView: vi.fn(),
        } as unknown as HTMLElement,
        focusLastItem: vi.fn(),
        focusFirstInvalidItem: vi.fn(),
      }

      setCategoryRef(mockElement, 'cat-1')
      await scrollToFirstInvalidField()
      await nextTick()

      expect(lastAddedCategoryId.value).toBe('cat-1')

      resetLastAddedCategory()

      expect(lastAddedCategoryId.value).toBeNull()
    })
  })
})
