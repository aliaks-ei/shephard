<template>
  <q-page-sticky
    position="bottom-right"
    :offset="[16, 16]"
  >
    <q-fab
      v-if="visible"
      v-model="isOpen"
      icon="eva-arrow-ios-upward-outline"
      active-icon="eva-close-outline"
      direction="up"
      color="primary"
      label="Actions"
      label-position="left"
      label-class="text-weight-bold"
      vertical-actions-align="right"
    >
      <q-fab-action
        v-for="action in visibleActions"
        :key="action.key"
        :icon="action.icon"
        external-label
        :label="action.label"
        label-position="left"
        label-class="text-weight-medium"
        :color="action.color"
        :loading="action.loading"
        @click="handleActionClick(action)"
      />
    </q-fab>
  </q-page-sticky>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface FabAction {
  key: string
  icon: string
  label: string
  color: string
  loading?: boolean
  visible?: boolean
  handler: () => void | Promise<void>
}

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'action-clicked', key: string): void
}>()

const props = defineProps<{
  modelValue: boolean
  actions: FabAction[]
  visible?: boolean
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const visibleActions = computed(() => {
  return props.actions.filter((action) => action.visible !== false)
})

async function handleActionClick(action: FabAction): Promise<void> {
  isOpen.value = false // Close FAB first
  emit('action-clicked', action.key)
  await action.handler()
}
</script>
