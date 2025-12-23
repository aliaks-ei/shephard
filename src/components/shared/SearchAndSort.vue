<template>
  <q-card
    class="bg-transparent q-mb-lg"
    flat
  >
    <q-card-section class="q-pa-none">
      <div
        class="row items-center"
        :class="$q.screen.lt.md ? 'q-col-gutter-sm' : 'q-col-gutter-md'"
      >
        <div class="col col-sm-9">
          <q-input
            :model-value="searchQuery"
            :placeholder="searchPlaceholder"
            dense
            debounce="300"
            outlined
            clearable
            no-error-icon
            inputmode="search"
            bg-color="white"
            hide-bottom-space
            @update:model-value="emit('update:searchQuery', $event?.toString() ?? '')"
          >
            <template #prepend>
              <q-icon name="eva-search-outline" />
            </template>
          </q-input>
        </div>
        <div class="col-auto col-sm-3">
          <q-select
            :model-value="sortBy"
            :options="sortOptions"
            :label="sortLabel"
            dense
            :display-value="displayValue"
            :hide-dropdown-icon="$q.screen.lt.md"
            option-label="label"
            option-value="value"
            outlined
            emit-value
            map-options
            hide-bottom-space
            bg-color="white"
            @update:model-value="emit('update:sortBy', $event)"
          >
            <template
              v-if="$q.screen.lt.md"
              #prepend
            >
              <q-icon
                class="q-pl-xs"
                name="eva-swap-outline"
              />
            </template>
          </q-select>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed } from 'vue'

type SortOption = {
  label: string
  value: string
}

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'update:sortBy', value: string): void
}>()

withDefaults(
  defineProps<{
    searchQuery: string
    sortBy: string
    searchPlaceholder: string
    sortOptions: SortOption[]
  }>(),
  {
    searchPlaceholder: 'Search...',
  },
)

const $q = useQuasar()

// Hide the label on mobile screens to make the sort select more compact
const sortLabel = computed(() => ($q.screen.lt.md ? undefined : 'Sort by'))

// Hide the display value on mobile to show only the icon
const displayValue = computed(() => ($q.screen.lt.md ? ' ' : undefined))
</script>
