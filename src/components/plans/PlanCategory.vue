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
      <PlanItem
        :ref="(el) => setItemRef(el, index)"
        :model-value="item"
        :currency="currency"
        :readonly="!!readonly"
        @update:model-value="(updatedItem: PlanItemUI) => handleUpdateItem(item.id, updatedItem)"
        @remove="$emit('remove-item', item.id)"
      />
    </template>
  </ItemCategory>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ItemCategory from 'src/components/shared/ItemCategory.vue'
import PlanItem from './PlanItem.vue'
import type { CurrencyCode } from 'src/utils/currency'
import type { PlanItemUI } from 'src/types'

const itemCategoryRef = ref<InstanceType<typeof ItemCategory> | null>(null)

const emit = defineEmits<{
  (e: 'update-item', itemId: string, item: PlanItemUI): void
  (e: 'remove-item', itemId: string): void
  (e: 'add-item', categoryId: string, categoryColor: string): void
}>()

interface Props {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  items: PlanItemUI[]
  currency: CurrencyCode
  readonly?: boolean
  defaultExpanded?: boolean
}

withDefaults(defineProps<Props>(), {
  readonly: false,
  defaultExpanded: false,
})

function handleUpdateItem(itemId: string, updatedItem: PlanItemUI): void {
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
