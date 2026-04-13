<template>
  <q-menu
    auto-close
    anchor="bottom right"
    self="top right"
    :offset="[0, 8]"
  >
    <q-list dense>
      <q-item
        clickable
        @click="emit('export')"
      >
        <q-item-section
          class="min-w-auto q-pr-sm"
          side
        >
          <q-icon
            name="eva-download-outline"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Export Plan</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="canEdit"
        clickable
        @click="emit('share')"
      >
        <q-item-section
          class="min-w-auto q-pr-sm"
          side
        >
          <q-icon
            name="eva-share-outline"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Share Plan</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="canEdit && canCancel"
        clickable
        class="text-warning q-px-md"
        @click="emit('cancel')"
      >
        <q-item-section
          class="min-w-auto q-pr-sm"
          side
        >
          <q-icon
            name="eva-stop-circle-outline"
            color="warning"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Cancel Plan</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="canEdit && canDelete"
        clickable
        class="text-negative q-px-md"
        @click="emit('delete')"
      >
        <q-item-section
          class="min-w-auto q-pr-sm"
          side
        >
          <q-icon
            name="eva-trash-2-outline"
            color="negative"
            size="xs"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>Delete Plan</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'share'): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const props = defineProps<{
  canEdit: boolean
  permissionLevel?: string | undefined
  planStatus: 'pending' | 'active' | 'completed' | 'cancelled'
}>()

const canDelete = computed(() => {
  return props.planStatus === 'pending' || props.planStatus === 'cancelled'
})

const canCancel = computed(() => {
  return props.planStatus === 'active'
})

const hasActions = computed(() => {
  return true
})

defineExpose({
  hasActions,
})
</script>
