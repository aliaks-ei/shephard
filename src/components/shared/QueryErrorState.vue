<template>
  <q-card
    flat
    bordered
    role="status"
    class="query-error-state text-center"
    :class="{ 'query-error-state--compact': compact }"
  >
    <q-card-section>
      <q-icon
        :name="content.icon"
        :color="content.color"
        size="40px"
        class="q-mb-sm"
      />
      <div class="text-subtitle1 text-weight-medium">{{ resolvedTitle }}</div>
      <p class="text-body2 text-muted q-mb-md">
        {{ resolvedMessage }}
      </p>
      <div class="row justify-center q-gutter-sm">
        <q-btn
          v-if="showRetry"
          color="primary"
          no-caps
          unelevated
          label="Retry"
          :loading="retrying"
          :disable="isOffline"
          @click="emit('retry')"
        />
        <q-btn
          v-if="showBack"
          flat
          no-caps
          color="primary"
          :label="backLabel"
          @click="emit('back')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNetworkStatus } from 'src/composables/useNetworkStatus'

export type QueryErrorStateKind = 'not-found' | 'denied' | 'error'

const emit = defineEmits<{
  retry: []
  back: []
}>()

const props = withDefaults(
  defineProps<{
    kind?: QueryErrorStateKind
    entityName?: string
    title?: string
    message?: string
    showRetry?: boolean
    retrying?: boolean
    showBack?: boolean
    backLabel?: string
    compact?: boolean
  }>(),
  {
    kind: 'error',
    entityName: 'data',
    showRetry: true,
    retrying: false,
    showBack: false,
    backLabel: 'Go back',
    compact: false,
  },
)

const { isOffline } = useNetworkStatus()

const content = computed(() => {
  if (isOffline.value) {
    return {
      icon: 'eva-wifi-off-outline',
      color: 'warning',
      title: 'You are offline',
      message: `Connect to the internet to load ${props.entityName.toLowerCase()}.`,
    }
  }

  switch (props.kind) {
    case 'not-found':
      return {
        icon: 'eva-search-outline',
        color: 'grey-7',
        title: `${props.entityName} not found`,
        message: `This ${props.entityName.toLowerCase()} may have been deleted or the link is no longer valid.`,
      }
    case 'denied':
      return {
        icon: 'eva-lock-outline',
        color: 'warning',
        title: 'Access denied',
        message: `You do not have permission to view this ${props.entityName.toLowerCase()}.`,
      }
    case 'error':
      return {
        icon: 'eva-alert-triangle-outline',
        color: 'negative',
        title: `Could not load ${props.entityName.toLowerCase()}`,
        message: 'Something went wrong while loading this data. Please try again.',
      }
    default: {
      const exhaustiveKind: never = props.kind
      return exhaustiveKind
    }
  }
})

const resolvedTitle = computed(() => props.title ?? content.value.title)
const resolvedMessage = computed(() => props.message ?? content.value.message)
</script>

<style lang="scss" scoped>
.query-error-state {
  max-width: 560px;
  margin: 24px auto;
  border-color: hsl(var(--border));
  background: hsl(var(--card));
}

.query-error-state--compact {
  margin: 0;
  max-width: none;
}
</style>
