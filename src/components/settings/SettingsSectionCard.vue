<template>
  <q-card
    :bordered="$q.dark.isActive"
    class="shadow-1 q-mb-lg"
  >
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium">
        {{ title }}
      </div>
      <div
        v-if="description"
        class="text-caption text-grey-6 q-mt-xs"
      >
        {{ description }}
      </div>

      <div class="q-mt-md">
        <slot />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style lang="scss">
.settings-section-card__icon-avatar {
  background: hsl(var(--muted));
}

.body--dark .settings-section-card__icon-avatar {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid hsl(var(--border));
}
</style>
