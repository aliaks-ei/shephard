<template>
  <q-menu
    auto-close
    anchor="bottom right"
    self="top right"
    :offset="[0, 8]"
  >
    <q-list separator>
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
          <q-item-label>Share Template</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="isOwner"
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
          <q-item-label>Delete Template</q-item-label>
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
}>()

const props = defineProps<{
  isOwner: boolean
  permissionLevel?: string | undefined
}>()

// Menu should only be visible if the user is the owner
const hasActions = computed(() => {
  return props.isOwner
})

defineExpose({
  hasActions,
})
</script>
