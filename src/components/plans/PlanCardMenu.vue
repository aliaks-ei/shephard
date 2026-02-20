<template>
  <q-menu
    auto-close
    anchor="bottom right"
    self="top right"
    :offset="[0, 8]"
  >
    <q-list separator>
      <q-item
        v-if="canEdit"
        clickable
        @click="emit('share')"
      >
        <q-item-section side>
          <q-icon
            name="eva-share-outline"
            size="18px"
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
        <q-item-section side>
          <q-icon
            name="eva-stop-circle-outline"
            color="warning"
            size="18px"
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
        <q-item-section side>
          <q-icon
            name="eva-trash-2-outline"
            color="negative"
            size="18px"
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

// Menu should be visible if the user can edit (owner or edit permission)
const hasActions = computed(() => {
  return props.canEdit
})

defineExpose({
  hasActions,
})
</script>
