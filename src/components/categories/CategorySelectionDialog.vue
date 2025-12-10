<template>
  <q-dialog
    :model-value="modelValue"
    :transition-show="$q.screen.lt.md ? 'slide-up' : 'scale'"
    :transition-hide="$q.screen.lt.md ? 'slide-down' : 'scale'"
    :maximized="$q.screen.xs"
    :full-width="$q.screen.xs"
    :full-height="$q.screen.xs"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="column full-height">
      <!-- Fixed header section -->
      <q-card-section class="row items-center q-pb-none">
        <div class="col">
          <h2
            class="q-my-none"
            :class="$q.screen.lt.md ? 'text-subtitle2' : 'text-h6'"
          >
            Select Category
          </h2>
          <p
            class="text-grey-6 q-my-none"
            :class="$q.screen.lt.md ? 'text-caption' : 'text-body2'"
          >
            Choose from available predefined categories
          </p>
        </div>
        <q-btn
          icon="eva-close-outline"
          flat
          round
          dense
          :size="$q.screen.lt.md ? 'sm' : 'md'"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <!-- Fixed search section -->
      <q-card-section>
        <q-input
          v-model="searchQuery"
          placeholder="Search categories..."
          outlined
          dense
          no-error-icon
          clearable
          inputmode="search"
        >
          <template #prepend>
            <q-icon name="eva-search-outline" />
          </template>
        </q-input>
      </q-card-section>

      <q-separator />

      <!-- Scrollable content section -->
      <q-card-section class="col q-pt-none scroll">
        <q-list class="full-height">
          <div v-if="filteredCategories.length > 0">
            <q-item
              v-for="category in filteredCategories"
              :key="category.id"
              clickable
              @click="selectCategory(category)"
            >
              <q-item-section
                style="min-width: auto"
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
      </q-card-section>

      <!-- Fixed footer actions -->
      <q-card-actions
        align="right"
        class="q-mt-auto safe-area-bottom"
      >
        <q-btn
          flat
          label="Cancel"
          no-caps
          @click="$emit('update:modelValue', false)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import CategoryIcon from './CategoryIcon.vue'
import type { Category } from 'src/api'

const $q = useQuasar()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-selected', category: Category): void
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
