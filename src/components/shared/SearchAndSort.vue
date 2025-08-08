<template>
  <q-card
    class="q-mb-lg"
    flat
    bordered
  >
    <q-card-section>
      <div class="row items-center q-col-gutter-md">
        <div class="col-12 col-sm-9">
          <q-input
            :model-value="searchQuery"
            :placeholder="searchPlaceholder"
            debounce="300"
            outlined
            clearable
            @update:model-value="emit('update:searchQuery', $event?.toString() ?? '')"
          >
            <template #prepend>
              <q-icon name="eva-search-outline" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-sm-3">
          <q-select
            :model-value="sortBy"
            :options="sortOptions"
            label="Sort by"
            outlined
            emit-value
            @update:model-value="emit('update:sortBy', $event)"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
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
</script>
