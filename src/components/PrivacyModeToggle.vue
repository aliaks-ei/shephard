<template>
  <q-btn
    round
    flat
    :dense="$q.screen.lt.md"
    :icon="icon"
    @click="handleToggle"
  >
    <q-tooltip v-if="$q.screen.gt.sm">{{ tooltipText }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePreferencesStore } from 'src/stores/preferences'

const preferencesStore = usePreferencesStore()

const icon = computed(() => {
  return preferencesStore.isPrivacyModeEnabled ? 'eva-eye-off-outline' : 'eva-eye-outline'
})

const tooltipText = computed(() => {
  return preferencesStore.isPrivacyModeEnabled ? 'Show amounts' : 'Hide amounts'
})

function handleToggle() {
  void preferencesStore.togglePrivacyMode()
}
</script>
