<template>
  <span
    class="status-pill"
    :class="[`status-pill--${tone}`, `status-pill--${size}`]"
  >
    <q-icon
      v-if="icon"
      :name="icon"
      size="14px"
      class="status-pill__icon"
    />
    <span class="status-pill__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import type { StatusTone } from './status-tone'

withDefaults(
  defineProps<{
    label: string
    icon?: string | undefined
    tone: StatusTone
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'sm',
  },
)
</script>

<style scoped lang="scss">
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;

  &--md {
    padding: 4px 10px;
    font-size: 13px;
  }

  &--success {
    background: hsl(var(--success-soft-bg));
    color: hsl(var(--success-soft-fg));
  }

  &--warning {
    background: hsl(var(--warning-soft-bg));
    color: hsl(var(--warning-soft-fg));
  }

  &--destructive {
    background: hsl(var(--destructive-soft-bg));
    color: hsl(var(--destructive-soft-fg));
  }

  &--info {
    background: hsl(var(--info-soft-bg));
    color: hsl(var(--info-soft-fg));
  }

  &--muted {
    background: hsl(var(--muted));
    color: hsl(var(--muted-foreground));
  }

  // Spending runs ahead of the calendar: amber, never red
  &--pace {
    background: hsl(var(--pace-soft-bg));
    color: hsl(var(--pace-strong));
  }

  // Over budget: the only place red is used for money
  &--over {
    background: hsl(var(--over-soft-bg));
    color: hsl(var(--over));
  }
}

.status-pill__icon {
  flex: none;
}
</style>
