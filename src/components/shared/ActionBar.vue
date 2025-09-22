<template>
  <!-- Desktop: Header Actions -->
  <div
    v-if="!isMobile && hasVisibleActions"
    class="row items-center q-gutter-sm"
  >
    <!-- All Actions - No grouping needed -->
    <q-btn
      v-for="action in visibleActions"
      :key="action.key"
      :icon="action.icon"
      :label="action.label"
      :color="action.color"
      :loading="action.loading"
      :disabled="action.loading"
      no-caps
      outline
      @click="handleActionClick(action)"
    />
  </div>

  <!-- Mobile: Bottom Action Bar -->
  <q-page-sticky
    v-if="isMobile && hasVisibleActions"
    position="bottom"
    expand
    :offset="[0, 0]"
  >
    <div
      class="full-width q-pa-sm shadow-up-1"
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white'"
    >
      <!-- All Actions in Single Row -->
      <div class="row q-gutter-xs">
        <div
          v-for="action in visibleActions"
          :key="action.key"
          class="col"
        >
          <q-btn
            :icon="action.icon"
            :color="action.color"
            :loading="action.loading"
            :disabled="action.loading"
            flat
            stack
            :label="action.label"
            no-caps
            class="full-width"
            @click="handleActionClick(action)"
          ></q-btn>
        </div>
      </div>
    </div>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'

export interface ActionBarAction {
  key: string
  icon: string
  label: string
  color: string
  loading?: boolean
  visible?: boolean
  priority?: 'primary' | 'secondary'
  handler: () => void | Promise<void>
}

const emit = defineEmits<{
  (e: 'action-clicked', key: string): void
}>()

const props = defineProps<{
  actions: ActionBarAction[]
  visible?: boolean
}>()

const $q = useQuasar()

const isMobile = computed(() => $q.screen.lt.md)

const visibleActions = computed(() => {
  return props.actions.filter((action) => action.visible !== false)
})

const hasVisibleActions = computed(() => {
  return props.visible !== false && visibleActions.value.length > 0
})

async function handleActionClick(action: ActionBarAction): Promise<void> {
  emit('action-clicked', action.key)
  await action.handler()
}
</script>
