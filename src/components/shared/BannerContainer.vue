<template>
  <TransitionGroup
    name="banner"
    tag="div"
    class="full-width"
  >
    <AppBanner
      v-for="banner in banners"
      :key="banner.id"
      :variant="banner.variant"
      :message="banner.message"
      :dismissible="banner.dismissible ?? false"
      :auto-dismiss-ms="banner.autoDismissMs ?? 0"
      v-bind="banner.action ? { action: banner.action } : {}"
      class="q-mb-md"
      @dismiss="dismissBanner(banner.id)"
    />
  </TransitionGroup>
</template>

<script setup lang="ts">
import AppBanner from './AppBanner.vue'
import { useBanner } from 'src/composables/useBanner'

const { banners, dismissBanner } = useBanner()
</script>

<style lang="scss" scoped>
.banner-enter-active,
.banner-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.banner-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.banner-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
