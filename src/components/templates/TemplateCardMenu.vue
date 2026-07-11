<template>
  <q-menu
    :id="id"
    v-model="modelValue"
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
          <q-item-label>Export Template</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="canShare"
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
          <q-item-label>Share Template</q-item-label>
        </q-item-section>
      </q-item>
      <q-item
        v-if="canEdit"
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
          <q-item-label>Delete Template</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script setup lang="ts">
const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'export'): void
  (e: 'share'): void
  (e: 'delete'): void
}>()

defineProps<{
  canEdit: boolean
  canShare: boolean
  id?: string
}>()
</script>
