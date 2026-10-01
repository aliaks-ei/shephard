<template>
  <div
    class="category-icon category-tone-tile"
    :style="[toneStyle, { width: avatarSize, height: avatarSize }]"
    aria-hidden="true"
  >
    <q-icon
      :name="icon"
      :size="iconSize"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCategoryToneStyle } from 'src/utils/categories'

type CategoryIconSize = 'xs' | 'sm' | 'md' | 'lg'

interface Props {
  color: string
  icon: string
  size?: CategoryIconSize
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
})

const toneStyle = computed(() => getCategoryToneStyle(props.color))

const avatarSize = computed(() => {
  const sizeMap: Record<CategoryIconSize, string> = {
    xs: '24px',
    sm: '36px',
    md: '48px',
    lg: '64px',
  }
  return sizeMap[props.size]
})

const iconSize = computed(() => {
  const sizeMap: Record<CategoryIconSize, string> = {
    xs: '13px',
    sm: '18px',
    md: '24px',
    lg: '32px',
  }
  return sizeMap[props.size]
})
</script>

<style lang="scss" scoped>
// Tinted tile: rounded square, not a circle, so it reads as a category, not a person
.category-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 30%;
}
</style>
