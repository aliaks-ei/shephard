<template>
  <q-item class="items-center">
    <q-item-section
      avatar
      top
    >
      <q-avatar
        size="md"
        :style="{ backgroundColor: modelValue.color }"
        text-color="white"
      >
        <q-icon name="eva-pricetags-outline" />
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-select
        :model-value="modelValue.categoryId"
        :options="categoryOptions"
        option-value="id"
        option-label="name"
        label="Select category"
        outlined
        emit-value
        map-options
        hide-bottom-space
        :rules="[(val) => !!val || 'Category is required']"
        @update:model-value="updateCategorySelection($event)"
      >
        <template #prepend>
          <q-icon name="eva-grid-outline" />
        </template>
        <template #selected>
          <span>{{ getCategoryName(modelValue.categoryId) }}</span>
        </template>
        <template #option="{ opt, itemProps }">
          <q-item v-bind="itemProps">
            <q-item-section avatar>
              <q-avatar
                size="sm"
                :style="{ backgroundColor: opt.color }"
                text-color="white"
              >
                <q-icon name="eva-pricetags-outline" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ opt.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-item-section>

    <q-item-section
      style="max-width: 180px"
      top
    >
      <q-input
        :model-value="modelValue.amount"
        type="number"
        min="0"
        step="0.01"
        prefix="$"
        label="Amount"
        outlined
        hide-bottom-space
        :rules="[
          (val) => (val !== null && val !== undefined) || 'Amount is required',
          (val) => val > 0 || 'Amount must be greater than 0',
        ]"
        @update:model-value="updateAmount($event)"
      >
        <template #prepend>
          <q-icon name="eva-credit-card-outline" />
        </template>
      </q-input>
    </q-item-section>

    <q-item-section
      side
      top
    >
      <q-btn
        flat
        round
        icon="eva-trash-2-outline"
        color="negative"
        size="sm"
        @click="emit('remove')"
      >
        <q-tooltip>Remove category</q-tooltip>
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { useCategoriesStore } from 'src/stores/categories'
import type { TemplateCategoryItem, Category } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', item: TemplateCategoryItem): void
  (e: 'remove'): void
}>()

const props = defineProps<{
  modelValue: TemplateCategoryItem
  categoryOptions: Category[]
}>()

const categoriesStore = useCategoriesStore()

function getCategoryName(categoryId: string): string {
  const category = categoriesStore.getCategoryById(categoryId)
  return category?.name || 'Unknown Category'
}

function updateCategorySelection(categoryId: string): void {
  const category = categoriesStore.getCategoryById(categoryId)
  const updatedItem: TemplateCategoryItem = {
    ...props.modelValue,
    categoryId,
    color: category?.color || '#6B7280',
  }
  emit('update:modelValue', updatedItem)
}

function updateAmount(amount: string | number | null): void {
  const updatedItem: TemplateCategoryItem = {
    ...props.modelValue,
    amount: Number(amount) || 0,
  }
  emit('update:modelValue', updatedItem)
}
</script>
