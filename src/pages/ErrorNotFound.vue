<template>
  <div class="fullscreen column flex-center q-pa-xl">
    <div class="error-not-found__content column items-center text-center">
      <BrandIllustration
        name="sheep"
        :width="220"
        class="q-mb-lg"
      />

      <div class="text-h1 text-weight-bold text-primary q-mb-md">404</div>

      <div class="text-h5 q-mb-lg text-primary">This page wandered off</div>

      <div class="text-body1 q-mb-xl">
        The page you're looking for doesn't exist or has been moved. <br />
        Let's get you back to the flock:
      </div>

      <div class="row q-gutter-md">
        <q-btn
          color="primary"
          unelevated
          icon="eva-home-outline"
          label="Go to Home"
          to="/"
          no-caps
          dense
          class="q-py-md q-px-lg"
          aria-label="Go to Home"
        />

        <q-btn
          color="primary"
          unelevated
          icon="eva-clipboard-outline"
          label="View Plans"
          :to="{ name: 'plans' }"
          no-caps
          dense
          class="q-py-md q-px-lg"
          aria-label="Go to Plans"
        />

        <q-btn
          color="primary"
          unelevated
          icon="eva-settings-outline"
          label="Open Settings"
          :to="{ name: 'settings' }"
          no-caps
          dense
          class="q-py-md q-px-lg"
          aria-label="Open Settings"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BrandIllustration from 'src/components/shared/BrandIllustration.vue'
</script>

<style lang="scss" scoped>
.error-not-found__content {
  max-width: 600px;
}
</style>
