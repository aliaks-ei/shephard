<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <h2 class="text-h6 q-my-none">Add Expense Category</h2>
        <p class="text-body2 text-grey-6 q-my-none">Select an existing category</p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <h3 class="text-subtitle2 q-mb-md">Available Categories</h3>

        <q-list>
          <q-item
            v-for="category in availableCategories"
            :key="category.id"
            clickable
            v-ripple
            @click="selectCategory(category)"
          >
            <q-item-section avatar>
              <q-avatar
                size="sm"
                :style="{ backgroundColor: category.color }"
                text-color="white"
              >
                <q-icon name="eva-pricetags-outline" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ category.name }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="eva-chevron-right-outline" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExpenseCategory } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-selected', category: ExpenseCategory): void
}>()

const props = defineProps<{
  modelValue: boolean
  usedCategoryIds: string[]
  categories: ExpenseCategory[]
}>()

const availableCategories = computed(() =>
  props.categories.filter((category) => !props.usedCategoryIds.includes(category.id)),
)

function selectCategory(category: ExpenseCategory): void {
  emit('category-selected', category)
  emit('update:modelValue', false)
}
</script>
