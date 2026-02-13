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
    <div class="full-width q-px-sm">
      <div
        class="q-pa-xs"
        :style="floatingBarStyle"
      >
        <!-- All Actions in Single Row -->
        <div class="row q-gutter-xs items-center">
          <div
            v-for="action in visibleActions"
            :key="action.key"
            class="col"
          >
            <q-btn
              :icon="action.icon"
              :color="action.color"
              :loading="action.loading"
              :label="action.label"
              :disabled="action.loading"
              :style="{ borderRadius: 'var(--radius-full)' }"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width"
              @click="handleActionClick(action)"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page-sticky>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue'
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

const floatingBarStyle: StyleValue = {
  borderRadius: 'var(--radius-full)',
  background: 'hsl(var(--card))',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid hsl(var(--border))',
  marginBottom: 'max(12px, calc(12px + env(safe-area-inset-bottom, 0px)))',
}

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
