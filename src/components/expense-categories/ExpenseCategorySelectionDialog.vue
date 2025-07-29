<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <h2 class="text-h6 q-my-none">Add Expense Category</h2>
        <p class="text-body2 text-grey-6 q-my-none">
          Select an existing category or create a new one
        </p>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-list>
          <!-- Create New Category Option -->
          <q-item
            clickable
            v-ripple
            @click="openCreateCategoryDialog"
          >
            <q-item-section
              style="min-width: auto"
              avatar
            >
              <q-avatar
                size="sm"
                color="primary"
                text-color="white"
              >
                <q-icon name="eva-plus-outline" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">Create New Category</q-item-label>
              <q-item-label caption>Add a custom category for your expenses</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon
                name="eva-chevron-right-outline"
                color="primary"
              />
            </q-item-section>
          </q-item>

          <q-separator class="q-my-sm" />

          <div v-if="availableCategories.length > 0">
            <h3 class="text-subtitle2 q-mb-md">Available Categories</h3>
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
          </div>

          <div v-else>
            <div class="text-center q-py-md">
              <q-icon
                name="eva-pricetags-outline"
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

    <CategoryDialog
      v-model="showCreateCategoryDialog"
      @category-saved="onCategorySaved"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ExpenseCategory } from 'src/api'
import CategoryDialog from 'src/components/categories/CategoryDialog.vue'

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-selected', category: ExpenseCategory): void
}>()

const props = defineProps<{
  modelValue: boolean
  usedCategoryIds: string[]
  categories: ExpenseCategory[]
}>()

const showCreateCategoryDialog = ref(false)

const availableCategories = computed(() =>
  props.categories.filter((category) => !props.usedCategoryIds.includes(category.id)),
)

function selectCategory(category: ExpenseCategory): void {
  emit('category-selected', category)
  emit('update:modelValue', false)
}

function openCreateCategoryDialog(): void {
  showCreateCategoryDialog.value = true
}

function onCategorySaved(category: ExpenseCategory): void {
  emit('category-selected', category)
  emit('update:modelValue', false)
}
</script>
