<template>
  <AppDialogShell
    :model-value="modelValue"
    title="Select Category"
    subtitle="Choose from available predefined categories"
    body-class="q-pa-none"
    :body-scrollable="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="column no-wrap flex-fill-min-h-0">
      <div class="q-px-md q-pt-md q-pb-sm">
        <q-input
          v-model="searchQuery"
          placeholder="Search categories..."
          outlined
          dense
          no-error-icon
          clearable
          inputmode="search"
          hide-bottom-space
        >
          <template #prepend>
            <q-icon name="eva-search-outline" />
          </template>
        </q-input>
      </div>

      <q-separator />

      <!-- Scrollable content section -->
      <div class="col q-pt-none scroll">
        <q-list class="full-height">
          <div v-if="filteredCategories.length > 0">
            <q-item
              v-for="category in filteredCategories"
              :key="category.id"
              clickable
              @click="selectCategory(category)"
            >
              <q-item-section
                class="min-w-auto"
                avatar
              >
                <CategoryIcon
                  :color="category.color"
                  :icon="category.icon"
                  size="sm"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ category.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <div
            class="flex items-center justify-center full-height"
            v-else
          >
            <div class="text-center q-py-md">
              <q-icon
                name="eva-grid-outline"
                size="2rem"
                class="text-grey-4 q-mb-sm"
              />
              <div class="text-body2 text-grey-6">
                {{
                  searchQuery
                    ? 'No categories match your search'
                    : 'All categories are already in use'
                }}
              </div>
            </div>
          </div>
        </q-list>
      </div>
    </div>

    <template #footer>
      <q-btn
        flat
        label="Cancel"
        dense
        no-caps
        @click="$emit('update:modelValue', false)"
      />
    </template>
  </AppDialogShell>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppDialogShell from 'src/components/shared/AppDialogShell.vue'
import CategoryIcon from './CategoryIcon.vue'
import type { Category } from 'src/api'

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'category-selected': [category: Category]
}>()

const props = defineProps<{
  modelValue: boolean
  usedCategoryIds: string[]
  categories: Category[]
}>()

const searchQuery = ref('')

const availableCategories = computed(() =>
  props.categories.filter((category) => !props.usedCategoryIds.includes(category.id)),
)

const filteredCategories = computed(() => {
  if (!searchQuery.value || !searchQuery.value.trim()) {
    return availableCategories.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return availableCategories.value.filter((category) => category.name.toLowerCase().includes(query))
})

// Clear search when dialog is closed
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      searchQuery.value = ''
    }
  },
)

function selectCategory(category: Category): void {
  emit('category-selected', category)
  emit('update:modelValue', false)
}
</script>
