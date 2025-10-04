<template>
  <q-avatar
    :style="{ backgroundColor: color }"
    :size="avatarSize"
    text-color="white"
  >
    <q-icon
      :name="icon"
      :size="iconSize"
    />
  </q-avatar>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type CategoryIconSize = 'sm' | 'md' | 'lg'

interface Props {
  color: string
  icon: string
  size?: CategoryIconSize
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
})

const avatarSize = computed(() => {
  const sizeMap: Record<CategoryIconSize, string> = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  }
  return sizeMap[props.size]
})

const iconSize = computed(() => {
  const sizeMap: Record<CategoryIconSize, string> = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  }
  return sizeMap[props.size]
})
</script>
