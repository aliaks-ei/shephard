<template>
  <ItemCategory
    ref="itemCategoryRef"
    :category-id="categoryId"
    :category-name="categoryName"
    :category-color="categoryColor"
    :category-icon="categoryIcon"
    :items="items"
    :currency="currency"
    :readonly="!!readonly"
    :default-expanded="!!defaultExpanded"
    @add-item="$emit('add-item', $event, categoryColor)"
  >
    <template #item="{ item, index, setItemRef }">
      <TemplateItem
        :ref="(el) => setItemRef(el, index)"
        :model-value="item"
        :currency="currency"
        :readonly="!!readonly"
        @update:model-value="
          (updatedItem: TemplateItemUI) => handleUpdateItem(item.id, updatedItem)
        "
        @remove="$emit('remove-item', item.id)"
      />
    </template>
  </ItemCategory>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ItemCategory from 'src/components/shared/ItemCategory.vue'
import TemplateItem from './TemplateItem.vue'
import type { CurrencyCode } from 'src/utils/currency'
import type { TemplateItemUI } from 'src/types'

const itemCategoryRef = ref<InstanceType<typeof ItemCategory> | null>(null)

const emit = defineEmits<{
  (e: 'update-item', itemId: string, item: TemplateItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: TemplateItemUI[]
  currency: CurrencyCode
  readonly?: boolean
  defaultExpanded?: boolean
}

withDefaults(defineProps<Props>(), {
  readonly: false,
  defaultExpanded: false,
})

function handleUpdateItem(itemId: string, updatedItem: TemplateItemUI): void {
  emit('update-item', itemId, updatedItem)
}

function focusLastItem(): void {
  itemCategoryRef.value?.focusLastItem()
}

function focusFirstInvalidItem(): void {
  itemCategoryRef.value?.focusFirstInvalidItem()
}

defineExpose({
  focusLastItem,
  focusFirstInvalidItem,
})
</script>
