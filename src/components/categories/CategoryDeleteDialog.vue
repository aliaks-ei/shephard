<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card>
      <q-card-section>
        <h2 class="text-h6 q-my-none">Delete Category</h2>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="text-body2 q-mb-md">
          Are you sure you want to delete category
          <template v-if="category">
            <strong>{{ category.name }}</strong
            >?
          </template>
          This action cannot be undone.
        </div>

        <q-banner
          class="bg-orange-1 text-orange-8"
          rounded
          dense
        >
          <div class="text-body2 text-sm self-center">
            <strong>Warning:</strong> This may affect existing templates using this category.
          </div>
        </q-banner>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          flat
          label="Cancel"
          @click="$emit('update:modelValue', false)"
          :disable="isDeleting"
        />
        <q-btn
          unelevated
          label="Delete Category"
          color="negative"
          :loading="isDeleting"
          @click="onDelete"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseCategory } from 'src/api'

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'category-deleted'): void
}>()

const props = defineProps<{
  modelValue: boolean
  category: ExpenseCategory | null
}>()

const categoriesStore = useCategoriesStore()
const isDeleting = ref(false)

async function onDelete() {
  if (!props.category) return

  isDeleting.value = true

  try {
    await categoriesStore.removeCategory(props.category.id)
    emit('category-deleted')
    emit('update:modelValue', false)
  } finally {
    isDeleting.value = false
  }
}
</script>
