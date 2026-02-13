<template>
  <div class="floating-nav q-mx-sm q-pa-xs text-grey-7">
    <div class="row q-gutter-xs items-center">
      <!-- Home -->
      <div class="col">
        <q-btn
          icon="eva-home-outline"
          label="Home"
          to="/"
          :color="isActive('/') ? 'primary' : 'grey-7'"
          :style="isActive('/') ? activeStyle : undefined"
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
          :color="isActive('/plans') ? 'primary' : 'grey-7'"
          :style="isActive('/plans') ? activeStyle : undefined"
          size="sm"
          flat
          stack
          no-caps
          dense
          class="full-width"
        />
      </div>

      <!-- Add Expense FAB -->
      <div class="col column items-center justify-center">
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
          :color="isActive('/templates') ? 'primary' : 'grey-7'"
          :style="isActive('/templates') ? activeStyle : undefined"
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
          :color="isActive('/settings') ? 'primary' : 'grey-7'"
          :style="isActive('/settings') ? activeStyle : undefined"
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
import type { StyleValue } from 'vue'
import { useRouteActive } from 'src/composables/useRouteActive'

const emit = defineEmits<{ 'open-expense-dialog': [] }>()

const { isActive } = useRouteActive()

const activeStyle: StyleValue = {
  background: 'hsl(var(--primary) / 0.1)',
  borderRadius: 'var(--radius-full)',
}
</script>

<style lang="scss" scoped>
.floating-nav {
  border-radius: var(--radius-full);
  background: hsl(var(--card));
  box-shadow: var(--shadow-md);
  border: 1px solid hsl(var(--border));
  margin-bottom: max(12px, calc(12px + env(safe-area-inset-bottom, 0px)));
}
</style>
