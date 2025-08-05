<template>
  <q-menu
    auto-close
    anchor="bottom right"
    self="top right"
    :offset="[0, 8]"
  >
    <q-list separator>
      <q-item
        clickable
        @click="emit('edit')"
      >
        <q-item-section side>
          <q-icon
            :name="getMenuActionIcon()"
            size="18px"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getMenuActionText() }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="isOwner"
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
        v-if="isOwner && canCancel"
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
        v-if="isOwner && canDelete"
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
  (e: 'edit'): void
  (e: 'share'): void
  (e: 'delete'): void
  (e: 'cancel'): void
}>()

const props = defineProps<{
  isOwner: boolean
  permissionLevel?: string | undefined
  planStatus: 'pending' | 'active' | 'completed' | 'cancelled'
}>()

const canDelete = computed(() => {
  return props.planStatus === 'pending' || props.planStatus === 'cancelled'
})

const canCancel = computed(() => {
  return props.planStatus === 'active'
})

function getMenuActionText(): string {
  if (props.isOwner) return 'Edit Plan'
  if (props.permissionLevel === 'edit') return 'Edit Plan'
  return 'View Plan'
}

function getMenuActionIcon(): string {
  if (props.isOwner) return 'eva-edit-outline'
  if (props.permissionLevel === 'edit') return 'eva-edit-outline'
  return 'eva-eye-outline'
}
</script>
