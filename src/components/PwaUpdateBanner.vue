<template>
  <q-banner
    v-if="isUpdateAvailable"
    rounded
    role="status"
    class="pwa-update-banner text-white shadow-4"
  >
    <template #avatar>
      <q-icon name="eva-refresh-outline" />
    </template>

    <div class="text-weight-medium">A Shephard update is ready.</div>
    <div class="pwa-update-banner__description text-caption">
      {{
        hasBlockingWork
          ? 'Finish or close your open form or dialog before updating.'
          : 'Reload when you are ready to use the latest version.'
      }}
    </div>

    <template #action>
      <q-btn
        flat
        no-caps
        color="white"
        :label="isApplying ? 'Updating…' : 'Update now'"
        :loading="isApplying"
        :disable="hasBlockingWork || isApplying"
        class="pwa-update-banner__action"
        @click="activateUpdate"
      />
    </template>
  </q-banner>
</template>

<script setup lang="ts">
import { usePwaUpdate } from 'src/composables/usePwaUpdate'

const { activateUpdate, hasBlockingWork, isApplying, isUpdateAvailable } = usePwaUpdate()
</script>

<style scoped>
.pwa-update-banner {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  bottom: max(16px, env(safe-area-inset-bottom, 0px));
  left: max(16px, env(safe-area-inset-left, 0px));
  z-index: 7000;
  max-width: 560px;
  margin-inline: auto;
  background: #002427;
  color: #fff;
}

.pwa-update-banner__description {
  color: rgb(255 255 255 / 92%);
  line-height: 1.45;
}

.pwa-update-banner__action {
  min-height: 44px;
}

@media (max-width: 599px) {
  .pwa-update-banner {
    right: max(8px, env(safe-area-inset-right, 0px));
    bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    left: max(8px, env(safe-area-inset-left, 0px));
    max-width: none;
  }

  .pwa-update-banner :deep(.q-banner__content) {
    min-width: 0;
  }

  .pwa-update-banner :deep(.q-banner__actions) {
    width: 100%;
    justify-content: flex-end;
    padding-top: 8px;
    padding-left: 0;
  }
}
</style>
