<template>
  <div class="floating-nav liquid-glass-surface q-mx-sm q-mb-none">
    <div class="mobile-nav-row items-center">
      <div
        class="mobile-nav-highlight liquid-glass-animated no-pointer-events"
        :style="highlightStyle"
      />

      <!-- Home -->
      <div class="mobile-nav-col min-w-0">
        <q-btn
          icon="eva-home-outline"
          label="Home"
          to="/"
          :color="isActive('/') ? 'primary' : undefined"
          :ripple="false"
          size="sm"
          flat
          stack
          dense
          no-caps
          :class="['full-width', 'mobile-nav-action', 'liquid-glass-animated']"
        />
      </div>

      <!-- Plans -->
      <div class="mobile-nav-col min-w-0">
        <q-btn
          icon="eva-calendar-outline"
          label="Plans"
          to="/plans"
          :color="isActive('/plans') ? 'primary' : undefined"
          :ripple="false"
          size="sm"
          flat
          stack
          no-caps
          dense
          :class="['full-width', 'mobile-nav-action', 'liquid-glass-animated']"
        />
      </div>

      <!-- Add Expense FAB -->
      <div class="mobile-nav-col min-w-0 column items-center justify-center">
        <q-btn
          icon="eva-plus-outline"
          round
          :ripple="false"
          size="md"
          class="mobile-nav-add-btn glass-fab-btn liquid-glass-animated"
          @click="emit('open-expense-dialog')"
        />
      </div>

      <!-- Templates -->
      <div class="mobile-nav-col min-w-0">
        <q-btn
          icon="eva-file-text-outline"
          label="Templates"
          to="/templates"
          :color="isActive('/templates') ? 'primary' : undefined"
          :ripple="false"
          size="sm"
          flat
          stack
          no-caps
          dense
          :class="['full-width', 'mobile-nav-action', 'liquid-glass-animated']"
        />
      </div>

      <!-- Settings -->
      <div class="mobile-nav-col min-w-0">
        <q-btn
          icon="eva-settings-2-outline"
          label="Settings"
          to="/settings"
          :color="isActive('/settings') ? 'primary' : undefined"
          :ripple="false"
          size="sm"
          flat
          stack
          no-caps
          dense
          :class="['full-width', 'mobile-nav-action', 'liquid-glass-animated']"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouteActive } from 'src/composables/useRouteActive'

const emit = defineEmits<{ 'open-expense-dialog': [] }>()

const { isActive } = useRouteActive()

const activeSlot = computed(() => {
  if (isActive('/settings')) return 4
  if (isActive('/templates')) return 3
  if (isActive('/plans')) return 1
  return 0
})

const highlightStyle = computed(() => {
  return {
    '--mobile-nav-active-slot': activeSlot.value,
  }
})
</script>

<style lang="scss" scoped>
.floating-nav {
  padding: 2px;
}

.mobile-nav-row {
  --mobile-nav-gap: 4px;
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--mobile-nav-gap);
}

.mobile-nav-highlight {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(
    ((100% - (var(--mobile-nav-gap) * 4)) / 5 * var(--mobile-nav-active-slot)) +
      (var(--mobile-nav-gap) * var(--mobile-nav-active-slot))
  );
  width: calc((100% - (var(--mobile-nav-gap) * 4)) / 5);
  border-radius: var(--radius-full);
  background: hsl(var(--glass-active-bg));
  box-shadow: inset 0 0 0 1px hsl(var(--glass-active-border));
  transition: left 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
  z-index: 0;
}

.mobile-nav-action {
  position: relative;
  z-index: 1;
  border-radius: var(--radius-full);
  color: hsl(var(--foreground));
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.mobile-nav-add-btn {
  position: relative;
  z-index: 2;
}

.mobile-nav-action :deep(.q-focus-helper),
.mobile-nav-add-btn :deep(.q-focus-helper) {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .mobile-nav-action:hover {
    background: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-highlight,
  .mobile-nav-action {
    transition: none;
  }
}
</style>
