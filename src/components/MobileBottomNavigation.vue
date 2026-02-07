<template>
  <div
    class="full-width shadow-up-1 q-pt-sm q-px-sm mobile-bottom-nav-content"
    :class="[$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark']"
  >
    <div class="row q-gutter-xs items-end">
      <!-- Home -->
      <div class="col">
        <q-btn
          icon="eva-home-outline"
          label="Home"
          to="/"
          :color="isActive('/') ? 'primary' : undefined"
          size="sm"
          flat
          stack
          dense
          no-caps
          class="full-width"
        />
      </div>

      <!-- Plans -->
      <div class="col">
        <q-btn
          icon="eva-calendar-outline"
          label="Plans"
          to="/plans"
          :color="isActive('/plans') ? 'primary' : undefined"
          size="sm"
          flat
          stack
          no-caps
          dense
          class="full-width"
        />
      </div>

      <!-- Add Expense FAB -->
      <div class="col text-center">
        <q-btn
          icon="eva-plus-outline"
          round
          color="primary"
          size="md"
          @click="emit('open-expense-dialog')"
        />
      </div>

      <!-- Templates -->
      <div class="col">
        <q-btn
          icon="eva-file-text-outline"
          label="Templates"
          to="/templates"
          :color="isActive('/templates') ? 'primary' : undefined"
          size="sm"
          flat
          stack
          no-caps
          dense
          class="full-width"
        />
      </div>

      <!-- Settings -->
      <div class="col">
        <q-btn
          icon="eva-settings-2-outline"
          label="Settings"
          to="/settings"
          :color="isActive('/settings') ? 'primary' : undefined"
          size="sm"
          flat
          stack
          no-caps
          dense
          class="full-width"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouteActive } from 'src/composables/useRouteActive'

const emit = defineEmits<{ 'open-expense-dialog': [] }>()

const { isActive } = useRouteActive()
</script>

<style scoped>
.mobile-bottom-nav-content {
  padding-bottom: max(8px, calc(8px + env(safe-area-inset-bottom, 0px)));
}
</style>
