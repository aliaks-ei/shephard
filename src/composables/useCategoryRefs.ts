import { ref, nextTick } from 'vue'
import type { Ref } from 'vue'
import type { BaseItemUI } from 'src/types'

interface CategoryComponent {
  $el: HTMLElement
  focusLastItem: () => void
  focusFirstInvalidItem: () => void
}

export function useCategoryRefs<T extends BaseItemUI>(items: Ref<T[]>) {
  const categoryRefs = ref<Map<string, CategoryComponent>>(new Map())
  const lastAddedCategoryId = ref<string | null>(null)

  function setCategoryRef(el: unknown, categoryId: string): void {
    if (el && typeof el === 'object' && 'focusLastItem' in el) {
      const component = el as CategoryComponent
      if (typeof component.focusLastItem === 'function') {
        categoryRefs.value.set(categoryId, component)
      }
    } else {
      categoryRefs.value.delete(categoryId)
    }
  }

  function getFirstInvalidItem(): { categoryId: string; item: T } | null {
    for (const item of items.value) {
      if (!item.name.trim() || item.amount <= 0) {
        return { categoryId: item.categoryId, item }
      }
    }
    return null
  }

  async function scrollToFirstInvalidField(): Promise<void> {
    const firstInvalidItem = getFirstInvalidItem()
    if (!firstInvalidItem) return

    const categoryRef = categoryRefs.value.get(firstInvalidItem.categoryId)
    if (!categoryRef) return

    const categoryElement = categoryRef.$el
    if (!categoryElement) return

    categoryElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })

    await nextTick()
    lastAddedCategoryId.value = firstInvalidItem.categoryId
    categoryRef.focusFirstInvalidItem()
  }

  function resetLastAddedCategory(): void {
    lastAddedCategoryId.value = null
  }

  return {
    categoryRefs,
    lastAddedCategoryId,
    setCategoryRef,
    getFirstInvalidItem,
    scrollToFirstInvalidField,
    resetLastAddedCategory,
  }
}
