<template>
  <q-page-sticky
    v-if="hasVisibleToolbar"
    position="bottom"
    expand
    :offset="[0, 0]"
  >
    <!-- One wide primary action, then round glass buttons for the rest -->
    <div class="detail-action-bar full-width q-px-sm safe-area-bottom-toolbar--glass">
      <q-btn
        :icon="primaryAction.icon"
        :label="primaryAction.label"
        :loading="primaryAction.loading"
        :disable="primaryAction.loading || primaryAction.disabled || isPrimaryOffline"
        no-caps
        unelevated
        class="detail-action-bar__primary glass-fab-btn liquid-glass-animated"
        @click="void handlePrimaryClick()"
      />

      <q-btn
        v-for="action in directActions"
        :key="action.key"
        :icon="action.icon"
        :loading="action.loading"
        :disable="action.loading || action.disabled"
        round
        flat
        :aria-label="action.label"
        class="detail-action-bar__round liquid-glass-surface liquid-glass-animated"
        @click="void handleActionClick(action)"
      />

      <q-btn
        v-if="moreMenuActions.length > 0"
        icon="eva-more-horizontal-outline"
        round
        flat
        aria-label="More actions"
        class="detail-action-bar__round liquid-glass-surface liquid-glass-animated"
        aria-haspopup="menu"
        :aria-expanded="String(showMoreMenu)"
        aria-controls="detail-mobile-actions-menu"
      >
        <q-menu
          id="detail-mobile-actions-menu"
          v-model="showMoreMenu"
          auto-close
          anchor="top right"
          self="bottom right"
          :offset="[0, 8]"
        >
          <q-list class="menu-list--wide">
            <q-item
              v-for="action in moreMenuActions"
              :key="action.key"
              clickable
              :disable="action.disabled"
              class="detail-action-bar__menu-item"
              @click="void handleActionClick(action)"
            >
              <q-item-section
                avatar
                class="menu-avatar q-pr-sm"
              >
                <q-icon
                  :name="action.icon"
                  :color="isDestructiveAction(action) ? 'negative' : undefined"
                  :class="{ 'text-muted': !isDestructiveAction(action) }"
                  size="xs"
                />
              </q-item-section>

              <q-item-section :class="isDestructiveAction(action) ? 'text-negative' : ''">
                {{ action.label }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
  </q-page-sticky>

  <ExpenseRegistrationDialog
    v-if="hasOpenedExpenseDialog"
    v-model="showExpenseDialog"
    :default-plan-id="fallbackPlanId"
    auto-select-recent-plan
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ActionBarAction } from 'src/types'
import { usePreferencesStore } from 'src/stores/preferences'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'
import { useNetworkStatus } from 'src/composables/useNetworkStatus'

const emit = defineEmits<{
  (e: 'action-clicked', key: string): void
}>()

const props = defineProps<{
  actions: ActionBarAction[]
  visible?: boolean
}>()

const route = useRoute()
const router = useRouter()
const preferencesStore = usePreferencesStore()
const { isOffline } = useNetworkStatus()

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)
const showMoreMenu = ref(false)

// The primary action gets the wide button. Add expense wins, then Save.
const PRIMARY_KEYS = ['add-expense', 'save']
// One round shortcut next to the primary action; the rest go into More
const DIRECT_KEYS = ['add-category', 'share']

const visibleActions = computed(() => props.actions.filter((action) => action.visible !== false))

const fallbackPlanId = computed(() => {
  if (route.name !== 'plan') return null
  return typeof route.params.id === 'string' ? route.params.id : null
})

const fallbackAddExpense: ActionBarAction = {
  key: 'add-expense',
  icon: 'eva-plus-outline',
  label: 'Add expense',
  color: 'primary',
  handler: () => {
    hasOpenedExpenseDialog.value = true
    showExpenseDialog.value = true
  },
}

const primaryAction = computed<ActionBarAction>(() => {
  for (const key of PRIMARY_KEYS) {
    const action = visibleActions.value.find((item) => item.key === key)
    if (action) return action
  }
  return fallbackAddExpense
})

const isPrimaryOffline = computed(
  () => primaryAction.value.key === 'add-expense' && isOffline.value,
)

const secondaryActions = computed(() =>
  visibleActions.value.filter((action) => action.key !== primaryAction.value.key),
)

const directActions = computed(() => {
  const direct = DIRECT_KEYS.map((key) =>
    secondaryActions.value.find((action) => action.key === key),
  ).find(Boolean)
  return direct ? [direct] : []
})

function isDestructiveAction(action: ActionBarAction): boolean {
  return action.key === 'cancel' || action.key === 'delete'
}

// Detail pages hide the global header on mobile, so its utilities live here
const utilityActions = computed<ActionBarAction[]>(() => {
  const list: ActionBarAction[] = []
  if (route.path.startsWith('/plans/')) {
    list.push({
      key: 'plans-list',
      icon: 'eva-calendar-outline',
      label: 'All plans',
      color: 'info',
      handler: async () => {
        await router.push({ name: 'plans' })
      },
    })
  }
  if (route.path.startsWith('/templates/')) {
    list.push({
      key: 'templates-list',
      icon: 'eva-file-text-outline',
      label: 'All templates',
      color: 'info',
      handler: async () => {
        await router.push({ name: 'templates' })
      },
    })
  }
  list.push({
    key: 'privacy',
    icon: preferencesStore.isPrivacyModeEnabled ? 'eva-eye-outline' : 'eva-eye-off-outline',
    label: preferencesStore.isPrivacyModeEnabled ? 'Show amounts' : 'Hide amounts',
    color: 'info',
    handler: async () => {
      await preferencesStore.togglePrivacyMode()
    },
  })
  return list
})

const moreMenuActions = computed<ActionBarAction[]>(() => {
  const directKeys = new Set(directActions.value.map((action) => action.key))
  const rest = secondaryActions.value.filter((action) => !directKeys.has(action.key))
  return [
    ...rest.filter((action) => !isDestructiveAction(action)),
    ...utilityActions.value,
    ...rest.filter(isDestructiveAction),
  ]
})

const hasVisibleToolbar = computed(() => props.visible !== false)

async function handleActionClick(action: ActionBarAction): Promise<void> {
  if (action.disabled) return

  emit('action-clicked', action.key)
  await action.handler()
}

async function handlePrimaryClick(): Promise<void> {
  if (isPrimaryOffline.value) return
  await handleActionClick(primaryAction.value)
}
</script>

<style lang="scss" scoped>
.detail-action-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-action-bar__primary {
  flex: 1 1 auto;
  min-width: 0;
  height: 52px;
  font-size: 16px;
  font-weight: 600;

  :deep(.q-icon) {
    font-size: 20px;
  }
}

.detail-action-bar__round {
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  color: hsl(var(--foreground));

  // The glass top highlight reads as a separate cap on a small circle
  &::after {
    display: none;
  }
}

.detail-action-bar__menu-item {
  min-height: 44px;
}

.detail-action-bar__primary:focus-visible,
.detail-action-bar__round:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--glass-focus-ring));
}
</style>
