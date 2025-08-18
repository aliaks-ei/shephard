<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <h2 class="text-h6 q-my-none">Select Expense Category</h2>
        <p class="text-body2 text-grey-6 q-my-none">Choose from available predefined categories</p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list>
          <div v-if="availableCategories.length > 0">
            <q-item
              v-for="category in availableCategories"
              :key="category.id"
              clickable
              v-ripple
              @click="selectCategory(category)"
            >
              <q-item-section
                style="min-width: auto"
                avatar
              >
                <q-avatar
                  size="sm"
                  :style="{ backgroundColor: category.color }"
                  text-color="white"
                >
                  <q-icon :name="category.icon" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ category.name }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="eva-chevron-right-outline" />
              </q-item-section>
            </q-item>
          </div>

          <div v-else>
            <div class="text-center q-py-md">
              <q-icon
                name="eva-grid-outline"
                size="2rem"
                class="text-grey-4 q-mb-sm"
              />
              <div class="text-body2 text-grey-6">All categories are already in use</div>
            </div>
          </div>
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
