<template>
  <q-card
    flat
    class="text-center q-py-xl"
  >
    <q-card-section>
      <q-icon
        :name="currentIcon"
        size="4rem"
        class="text-grey-4 q-mb-md"
      />

      <h3 class="text-h5 q-mb-sm q-mt-none text-grey-7">
        {{ currentTitle }}
      </h3>

      <p class="text-body2 text-grey-5 q-mb-lg">
        {{ currentDescription }}
      </p>

      <div class="q-gutter-sm">
        <q-btn
          v-if="showClearSearch"
          flat
          color="primary"
          label="Clear Search"
          @click="emit('clearSearch')"
        />

        <q-btn
          color="primary"
          icon="eva-plus-outline"
          :label="createButtonLabel"
          unelevated
          @click="emit('create')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'clearSearch'): void
  (e: 'create'): void
}>()

const props = withDefaults(
  defineProps<{
    hasSearchQuery: boolean
    searchIcon?: string
    emptyIcon?: string
    searchTitle?: string
    emptyTitle?: string
    searchDescription?: string
    emptyDescription?: string
    createButtonLabel?: string
  }>(),
  {
    searchIcon: 'eva-search-outline',
    emptyIcon: 'eva-grid-outline',
    searchTitle: 'No results found',
    emptyTitle: 'No items yet',
    searchDescription: 'Try adjusting your search terms or create a new item',
    emptyDescription: 'Create your first item to get started',
    createButtonLabel: 'Create Item',
  },
)

const currentIcon = computed(() => (props.hasSearchQuery ? props.searchIcon : props.emptyIcon))
const currentTitle = computed(() => (props.hasSearchQuery ? props.searchTitle : props.emptyTitle))
const showClearSearch = computed(() => props.hasSearchQuery)
const currentDescription = computed(() =>
  props.hasSearchQuery ? props.searchDescription : props.emptyDescription,
)
</script>
