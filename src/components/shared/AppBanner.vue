<template>
  <div
    v-if="isVisible"
    :class="bannerClasses"
    :role="ariaRole"
    :aria-live="ariaLive"
    :aria-atomic="true"
  >
    <q-icon
      :name="iconName"
      size="20px"
      class="q-mr-sm"
    />

    <span class="app-banner__message">{{ message }}</span>

    <q-btn
      v-if="action"
      flat
      dense
      no-caps
      :label="action.label"
      :class="actionButtonClass"
      @click="action.handler"
    />

    <q-btn
      v-if="dismissible"
      flat
      dense
      round
      size="sm"
      icon="eva-close-outline"
      :class="dismissButtonClass"
      aria-label="Dismiss"
      @click="dismiss"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type BannerVariant = 'success' | 'error' | 'warning' | 'info'

interface BannerAction {
  label: string
  handler: () => void
}

interface Props {
  variant: BannerVariant
  message: string
  dismissible?: boolean
  action?: BannerAction
  autoDismissMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  dismissible: false,
  autoDismissMs: 0,
})

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const isVisible = ref(true)
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null

const variantConfig = computed(() => {
  const configs: Record<BannerVariant, { bg: string; text: string; icon: string }> = {
    success: {
      bg: 'bg-green-1',
      text: 'text-green-6',
      icon: 'eva-checkmark-circle-outline',
    },
    error: {
      bg: 'bg-red-1',
      text: 'text-red-6',
      icon: 'eva-alert-triangle-outline',
    },
    warning: {
      bg: 'bg-orange-1',
      text: 'text-orange-6',
      icon: 'eva-alert-triangle-outline',
    },
    info: {
      bg: 'bg-cyan-1',
      text: 'text-cyan-6',
      icon: 'eva-info-outline',
    },
  }
  return configs[props.variant]
})

const bannerClasses = computed(() => [
  'app-banner',
  'row',
  'items-center',
  'q-pa-sm',
  'q-px-md',
  variantConfig.value.bg,
  variantConfig.value.text,
])

const iconName = computed(() => variantConfig.value.icon)

const actionButtonClass = computed(() => variantConfig.value.text)

const dismissButtonClass = computed(() => variantConfig.value.text)

const ariaRole = computed(() => {
  return props.variant === 'error' ? 'alert' : 'status'
})

const ariaLive = computed(() => {
  return props.variant === 'error' ? 'assertive' : 'polite'
})

function dismiss(): void {
  isVisible.value = false
  emit('dismiss')
}

onMounted(() => {
  if (props.autoDismissMs > 0) {
    autoDismissTimer = setTimeout(() => {
      dismiss()
    }, props.autoDismissMs)
  }
})

onUnmounted(() => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer)
  }
})
</script>

<style lang="scss" scoped>
.app-banner {
  width: 100%;
  border-radius: $generic-border-radius;
}

.app-banner__message {
  flex: 1;
  min-width: 0;
}
</style>
