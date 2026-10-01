<template>
  <div
    class="mobile-nav q-mx-sm"
    :class="{ 'mobile-nav--collapsed': collapsed }"
  >
    <nav
      class="floating-nav liquid-glass-surface"
      aria-label="Main"
    >
      <div
        class="mobile-nav-row items-center"
        :style="highlightStyle"
      >
        <div
          v-if="activeSlot !== null"
          class="mobile-nav-highlight liquid-glass-animated no-pointer-events"
        />

        <div
          v-for="tab in tabs"
          :key="tab.to"
          class="mobile-nav-col min-w-0"
        >
          <q-btn
            :icon="tab.icon"
            :label="tab.label"
            :to="tab.to"
            :color="activeTab === tab.to ? 'primary' : undefined"
            :ripple="false"
            size="sm"
            flat
            stack
            dense
            no-caps
            :class="['full-width', 'mobile-nav-action', 'liquid-glass-animated']"
          />
        </div>
      </div>
    </nav>

    <!-- Add expense: detached from the tabs so it never reads as a destination -->
    <q-btn
      icon="eva-plus-outline"
      round
      :ripple="false"
      class="mobile-nav-add-btn glass-fab-btn liquid-glass-animated"
      :disable="!props.canAddExpense"
      aria-label="Add expense"
      @click="emit('open-expense-dialog')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouteActive } from 'src/composables/useRouteActive'

const props = withDefaults(
  defineProps<{
    canAddExpense?: boolean
    collapsed?: boolean
  }>(),
  {
    canAddExpense: true,
    collapsed: false,
  },
)

const emit = defineEmits<{ 'open-expense-dialog': [] }>()

const { isActive } = useRouteActive()

const tabs = [
  { icon: 'eva-home-outline', label: 'Home', to: '/' },
  { icon: 'eva-calendar-outline', label: 'Plans', to: '/plans' },
  { icon: 'eva-activity-outline', label: 'Activity', to: '/expenses' },
  { icon: 'eva-file-text-outline', label: 'Templates', to: '/templates' },
] as const

const activeTab = computed(() => tabs.find((tab) => isActive(tab.to))?.to ?? null)

const activeSlot = computed(() => {
  const index = tabs.findIndex((tab) => tab.to === activeTab.value)
  return index === -1 ? null : index
})

const highlightStyle = computed(() => ({
  '--mobile-nav-active-slot': activeSlot.value ?? 0,
}))
</script>

<style lang="scss" scoped>
.mobile-nav {
  --mobile-nav-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.floating-nav {
  flex: 1 1 auto;
  min-width: 0;
  padding: 3px;
  transition:
    transform var(--duration-base) var(--ease-out-quint),
    padding var(--duration-base) var(--ease-out-quint);
}

.mobile-nav-row {
  --mobile-nav-gap: 2px;
  --mobile-nav-tabs: 4;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--mobile-nav-tabs), minmax(0, 1fr));
  gap: var(--mobile-nav-gap);
}

.mobile-nav-highlight {
  --mobile-nav-tab-width: calc(
    (100% - (var(--mobile-nav-gap) * (var(--mobile-nav-tabs) - 1))) / var(--mobile-nav-tabs)
  );
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc((var(--mobile-nav-tab-width) + var(--mobile-nav-gap)) * var(--mobile-nav-active-slot));
  width: var(--mobile-nav-tab-width);
  border-radius: var(--radius-full);
  background: hsl(var(--glass-active-bg));
  box-shadow: inset 0 0 0 1px hsl(var(--glass-active-border));
  transition: left var(--duration-slow) var(--ease-out-quint);
  z-index: 0;
}

.mobile-nav-action {
  position: relative;
  z-index: 1;
  color: hsl(var(--foreground));
  min-height: calc(var(--mobile-nav-height) - 6px);
  transition:
    color var(--duration-fast) ease,
    min-height var(--duration-base) var(--ease-out-quint);

  :deep(.q-btn__content) {
    font-weight: 600;
  }

  :deep(.q-btn__content .block) {
    max-height: 1.4em;
    overflow: hidden;
    transition:
      max-height var(--duration-base) var(--ease-out-quint),
      opacity var(--duration-fast) ease;
  }
}

.mobile-nav-add-btn {
  flex: 0 0 auto;
  width: var(--mobile-nav-height);
  height: var(--mobile-nav-height);
  font-size: 18px;
  transition:
    transform var(--duration-base) var(--ease-spring),
    width var(--duration-base) var(--ease-out-quint),
    height var(--duration-base) var(--ease-out-quint),
    background-color var(--duration-fast) ease;

  &:active {
    transform: scale(0.94);
  }
}

// Minimised on scroll down: labels fold away, the bar gets shorter.
.mobile-nav--collapsed {
  --mobile-nav-height: 46px;

  .mobile-nav-action :deep(.q-btn__content .block) {
    max-height: 0;
    opacity: 0;
  }
}

.mobile-nav-action:focus-visible,
.mobile-nav-add-btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--glass-focus-ring));
}

@media (hover: hover) and (pointer: fine) {
  .mobile-nav-action:hover {
    background: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-nav,
  .mobile-nav-highlight,
  .mobile-nav-action,
  .mobile-nav-action :deep(.q-btn__content .block),
  .mobile-nav-add-btn {
    transition: none;
  }
}
</style>
