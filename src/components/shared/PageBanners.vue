<template>
  <template v-if="visibleBanners.length > 0">
    <q-banner
      v-for="banner in visibleBanners"
      :key="banner.type"
      :class="banner.class"
      class="q-mb-lg"
      rounded
    >
      <template #avatar>
        <q-icon :name="banner.icon" />
      </template>
      <div v-html="banner.message" />
    </q-banner>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface Banner {
  type: string
  class: string
  icon: string
  message: string
  visible?: boolean
}

const props = defineProps<{
  banners: Banner[]
}>()

const visibleBanners = computed(() => {
  return props.banners.filter((banner) => banner.visible !== false)
})
</script>
