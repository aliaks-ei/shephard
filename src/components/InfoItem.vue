<template>
  <div
    class="col-12"
    :class="columnClass"
  >
    <q-item class="q-pa-sm card-bg">
      <q-item-section avatar>
        <q-icon
          :name="icon"
          :color="iconColor"
        />
      </q-item-section>
      <q-item-section>
        <q-item-label
          caption
          class="text-caption"
        >
          {{ label }}
        </q-item-label>
        <q-item-label :class="valueClass">{{ value }}</q-item-label>
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
  iconColor?: string
  fullWidth?: boolean
  valueClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  fullWidth: false,
  valueClass: 'text-primary',
})

const columnClass = computed(() => (props.fullWidth ? 'col-sm-12' : 'col-sm-6'))
</script>
