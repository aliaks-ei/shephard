<template>
  <div
    class="row items-center"
    :class="spacing"
  >
    <q-icon
      :name="icon"
      class="q-mr-sm"
      :size="iconSize"
    />
    <component
      :is="headingTag"
      class="q-my-none"
      :class="headingClass"
    >
      {{ title }}
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  title: string
  iconSize?: string
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  spacing?: string
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: '20px',
  headingLevel: 'h2',
  spacing: 'q-mb-md',
})

const headingTag = computed(() => props.headingLevel)
const headingClass = computed(() => {
  const levelMap: Record<string, string> = {
    h1: 'text-h4',
    h2: 'text-h6',
    h3: 'text-h6',
    h4: 'text-subtitle1',
    h5: 'text-subtitle2',
    h6: 'text-body1',
  }
  return levelMap[props.headingLevel] || 'text-h6'
})
</script>
