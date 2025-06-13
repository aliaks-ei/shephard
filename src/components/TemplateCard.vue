<template>
  <q-card
    class="cursor-pointer"
    flat
    bordered
    @click="editTemplate"
  >
    <q-card-section>
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-h6 text-primary">{{ template.name }}</div>
        <q-btn
          flat
          round
          size="sm"
          icon="eva-more-vertical-outline"
          @click.stop
        >
          <q-menu>
            <q-list>
              <q-item
                clickable
                @click="editTemplate"
              >
                <q-item-section avatar>
                  <q-icon name="eva-edit-outline" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-separator />
              <q-item
                clickable
                class="text-negative"
                @click="deleteTemplate"
              >
                <q-item-section avatar>
                  <q-icon name="eva-trash-2-outline" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>

      <div class="text-caption text-capitalize text-grey-6 q-mb-sm">
        {{ template.duration }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { Template } from 'src/api'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', template: Template): void
}>()

const props = defineProps<{
  template: Template
}>()

function editTemplate(): void {
  emit('edit', props.template.id)
}

function deleteTemplate(): void {
  emit('delete', props.template)
}
</script>
