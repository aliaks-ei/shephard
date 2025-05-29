<template>
  <div
    class="col-12"
    :class="columnClass"
  >
    <q-item class="q-pa-sm">
      <q-item-section avatar>
        <q-icon
          :name="icon"
          color="primary"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label
          caption
          class="text-caption"
        >
          {{ label }}
        </q-item-label>
        <q-item-label class="text-primary">{{ value }}</q-item-label>
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  label: string
  value: string | null | undefined
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullWidth: false,
})

const columnClass = computed(() => (props.fullWidth ? 'col-sm-12' : 'col-sm-6'))
</script>
