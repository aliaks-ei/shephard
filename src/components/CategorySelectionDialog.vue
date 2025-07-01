<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Add Category Group</div>
        <div class="text-body2 text-grey-6">Select an existing category or create a new one</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-subtitle2 q-mb-md">Available Categories</div>

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

        <q-separator class="q-my-md" />

        <q-item
          clickable
          v-ripple
          @click="showCreateForm = true"
        >
          <q-item-section avatar>
            <q-avatar
              size="sm"
              color="primary"
              text-color="white"
            >
              <q-icon name="eva-plus-outline" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Create New Category</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Create New Category Form -->
        <q-expansion-item
          v-model="showCreateForm"
          class="q-mt-md"
        >
          <template #header>
            <q-item-section>
              <q-item-label class="text-weight-medium">New Category Details</q-item-label>
            </q-item-section>
          </template>

          <q-card-section class="q-pt-md">
            <q-form @submit="createAndSelectCategory">
              <q-input
                v-model="newCategoryName"
                label="Category Name"
                outlined
                :rules="[(val) => !!val?.trim() || 'Category name is required']"
                class="q-mb-md"
              />

              <div class="text-subtitle2 q-mb-sm">Choose Color</div>
              <div class="row q-gutter-sm q-mb-md">
                <q-btn
                  v-for="color in colorOptions"
                  :key="color"
                  round
                  size="sm"
                  :style="{ backgroundColor: color }"
                  :outline="newCategoryColor !== color"
                  @click="newCategoryColor = color"
                >
                  <q-icon
                    v-if="newCategoryColor === color"
                    name="eva-checkmark-outline"
                    color="white"
                  />
                </q-btn>
              </div>

              <div class="row q-gutter-sm justify-end">
                <q-btn
                  flat
                  label="Cancel"
                  @click="resetCreateForm"
                />
                <q-btn
                  color="primary"
                  label="Create & Select"
                  type="submit"
                  :loading="isCreating"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-expansion-item>
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
import { ref, computed } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { Category } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-selected', category: Category): void
}>()

const props = defineProps<{
  modelValue: boolean
  usedCategoryIds: string[]
}>()

const categoriesStore = useCategoriesStore()

const showCreateForm = ref(false)
const newCategoryName = ref('')
const newCategoryColor = ref('#6B7280')
const isCreating = ref(false)

const colorOptions = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
  '#6B7280',
  '#374151',
  '#1F2937',
]

const availableCategories = computed(() =>
  categoriesStore.categories.filter((category) => !props.usedCategoryIds.includes(category.id)),
)

function selectCategory(category: Category): void {
  emit('category-selected', category)
  emit('update:modelValue', false)
}

async function createAndSelectCategory(): Promise<void> {
  if (!newCategoryName.value.trim()) return

  isCreating.value = true
  try {
    const newCategory = await categoriesStore.addCategory({
      name: newCategoryName.value.trim(),
      color: newCategoryColor.value,
    })

    if (newCategory) {
      emit('category-selected', newCategory)
      emit('update:modelValue', false)
      resetCreateForm()
    }
  } finally {
    isCreating.value = false
  }
}

function resetCreateForm(): void {
  showCreateForm.value = false
  newCategoryName.value = ''
  newCategoryColor.value = '#6B7280'
}
</script>
