<template>
  <q-page-sticky
    v-if="hasVisibleToolbar"
    position="bottom"
    expand
    :offset="[0, 0]"
  >
    <div class="full-width q-px-sm mobile-action-shell">
      <div class="q-px-xs floating-bar liquid-glass-surface">
        <div class="row q-gutter-xs items-center">
          <div class="col">
            <q-btn
              v-if="slot1Action"
              :icon="slot1Action.icon"
              :label="slot1Action.label"
              :loading="slot1Action.loading"
              :disabled="slot1Action.loading"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width mobile-action-btn liquid-glass-animated"
              @click="void handleActionClick(slot1Action)"
            />
            <div
              v-else
              class="mobile-slot-placeholder"
            />
          </div>

          <div class="col">
            <q-btn
              v-if="slot2Action"
              :icon="slot2Action.icon"
              :label="slot2Action.label"
              :loading="slot2Action.loading"
              :disabled="slot2Action.loading"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width mobile-action-btn liquid-glass-animated"
              @click="void handleActionClick(slot2Action)"
            />
            <div
              v-else
              class="mobile-slot-placeholder"
            />
          </div>

          <div class="col column items-center justify-center">
            <q-btn
              icon="eva-plus-outline"
              round
              size="md"
              class="mobile-action-add-btn liquid-glass-animated"
              :loading="addExpenseAction?.loading"
              :disable="addExpenseAction?.loading"
              @click="void handleAddExpenseClick()"
            />
          </div>

          <div class="col">
            <q-btn
              v-if="slot4Action"
              :icon="slot4Action.icon"
              :label="slot4Action.label"
              :loading="slot4Action.loading"
              :disabled="slot4Action.loading"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width mobile-action-btn liquid-glass-animated"
              @click="void handleActionClick(slot4Action)"
            />
            <div
              v-else
              class="mobile-slot-placeholder"
            />
          </div>

          <div class="col">
            <q-btn
              v-if="hasMoreMenu"
              icon="eva-more-horizontal-outline"
              label="More"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width mobile-action-btn liquid-glass-animated"
            >
              <q-menu
                auto-close
                anchor="top right"
                self="bottom right"
                class="shadow-4"
              >
                <q-list class="detail-mobile-menu-list">
                  <q-item
                    v-for="action in moreMenuActions"
                    :key="action.key"
                    clickable
                    @click="void handleActionClick(action)"
                  >
                    <q-item-section
                      avatar
                      class="detail-mobile-menu-avatar"
                    >
                      <q-icon
                        :name="action.icon"
                        :color="isDestructiveAction(action) ? 'negative' : 'grey-7'"
                        size="sm"
                      />
                    </q-item-section>

                    <q-item-section :class="isDestructiveAction(action) ? 'text-negative' : ''">
                      {{ action.label }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>

            <q-btn
              v-else-if="slot5Action"
              :icon="slot5Action.icon"
              :label="slot5Action.label"
              :loading="slot5Action.loading"
              :disabled="slot5Action.loading"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width mobile-action-btn liquid-glass-animated"
              @click="void handleActionClick(slot5Action)"
            />

            <div
              v-else
              class="mobile-slot-placeholder"
            />
          </div>
        </div>
      </div>
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
import type { ActionBarAction } from './ActionBar.vue'
import { usePreferencesStore } from 'src/stores/preferences'
import ExpenseRegistrationDialog from 'src/components/expenses/ExpenseRegistrationDialog.vue'

interface ToolbarAction extends ActionBarAction {
  fallback?: boolean
}

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

const hasOpenedExpenseDialog = ref(false)
const showExpenseDialog = ref(false)

const visibleActions = computed(() => {
  return props.actions.filter((action) => action.visible !== false)
})

const fallbackPlanId = computed(() => {
  if (route.name !== 'plan') return null
  return typeof route.params.id === 'string' ? route.params.id : null
})

const addExpenseAction = computed(() => {
  return visibleActions.value.find((action) => action.key === 'add-expense')
})

const nonExpenseActions = computed(() => {
  return visibleActions.value.filter((action) => action.key !== 'add-expense')
})

const contextListAction = computed<ToolbarAction | null>(() => {
  if (route.path.startsWith('/plans/')) {
    return {
      key: 'plans-list',
      icon: 'eva-calendar-outline',
      label: 'List',
      color: 'info',
      fallback: true,
      handler: async () => {
        await router.push({ name: 'plans' })
      },
    }
  }

  if (route.path.startsWith('/templates/')) {
    return {
      key: 'templates-list',
      icon: 'eva-file-text-outline',
      label: 'List',
      color: 'info',
      fallback: true,
      handler: async () => {
        await router.push({ name: 'templates' })
      },
    }
  }

  return null
})

const settingsAction = computed<ToolbarAction>(() => ({
  key: 'settings',
  icon: 'eva-settings-2-outline',
  label: 'Settings',
  color: 'info',
  fallback: true,
  handler: async () => {
    await router.push({ name: 'settings' })
  },
}))

const privacyAction = computed<ToolbarAction>(() => ({
  key: 'privacy',
  icon: preferencesStore.isPrivacyModeEnabled ? 'eva-eye-off-outline' : 'eva-eye-outline',
  label: preferencesStore.isPrivacyModeEnabled ? 'Show' : 'Hide',
  color: 'info',
  fallback: true,
  handler: async () => {
    await preferencesStore.togglePrivacyMode()
  },
}))

const contextSwitchAction = computed<ToolbarAction | null>(() => {
  if (route.path.startsWith('/plans/')) {
    return {
      key: 'templates',
      icon: 'eva-file-text-outline',
      label: 'Templates',
      color: 'info',
      fallback: true,
      handler: async () => {
        await router.push({ name: 'templates' })
      },
    }
  }

  if (route.path.startsWith('/templates/')) {
    return {
      key: 'plans',
      icon: 'eva-calendar-outline',
      label: 'Plans',
      color: 'info',
      fallback: true,
      handler: async () => {
        await router.push({ name: 'plans' })
      },
    }
  }

  return null
})

const utilityFallbackActions = computed(() => {
  const actions: ToolbarAction[] = []

  if (contextListAction.value) {
    actions.push(contextListAction.value)
  }

  actions.push(settingsAction.value)
  actions.push(privacyAction.value)

  if (contextSwitchAction.value) {
    actions.push(contextSwitchAction.value)
  }

  return actions
})

function isDestructiveAction(action: ActionBarAction): boolean {
  return action.key === 'cancel' || action.key === 'delete'
}

const nonDestructiveActions = computed(() => {
  return nonExpenseActions.value.filter((action) => !isDestructiveAction(action))
})

const destructiveActions = computed(() => {
  return nonExpenseActions.value.filter((action) => isDestructiveAction(action))
})

const hasMoreMenu = computed(() => {
  return destructiveActions.value.length > 0 || nonDestructiveActions.value.length > 4
})

const directActionCapacity = computed(() => {
  return hasMoreMenu.value ? 3 : 4
})

const directActions = computed<ToolbarAction[]>(() => {
  const selected = nonDestructiveActions.value.slice(0, directActionCapacity.value)
  const selectedKeys = new Set(selected.map((action) => action.key))

  for (const utilityAction of utilityFallbackActions.value) {
    if (selected.length >= directActionCapacity.value) break

    if (selectedKeys.has(utilityAction.key)) continue
    if (nonExpenseActions.value.some((action) => action.key === utilityAction.key)) continue

    selected.push(utilityAction)
    selectedKeys.add(utilityAction.key)
  }

  return selected
})

const moreMenuActions = computed<ToolbarAction[]>(() => {
  if (!hasMoreMenu.value) return []

  const selectedKeys = new Set(directActions.value.map((action) => action.key))

  const remainingActions = nonDestructiveActions.value.slice(directActionCapacity.value)
  const utilityActions = utilityFallbackActions.value.filter(
    (action) => !selectedKeys.has(action.key),
  )
  const combined = [...remainingActions, ...destructiveActions.value, ...utilityActions]

  const deduped: ToolbarAction[] = []
  const seenKeys = new Set<string>()

  for (const action of combined) {
    if (seenKeys.has(action.key)) continue
    seenKeys.add(action.key)
    deduped.push(action)
  }

  return deduped
})

const slot1Action = computed(() => {
  return directActions.value[0] ?? null
})

const slot2Action = computed(() => {
  return directActions.value[1] ?? null
})

const slot4Action = computed(() => {
  return directActions.value[2] ?? null
})

const slot5Action = computed(() => {
  if (hasMoreMenu.value) return null
  return directActions.value[3] ?? null
})

const hasVisibleToolbar = computed(() => {
  return props.visible !== false
})

async function handleActionClick(action: ToolbarAction): Promise<void> {
  emit('action-clicked', action.key)
  await action.handler()
}

async function handleAddExpenseClick(): Promise<void> {
  if (addExpenseAction.value) {
    await handleActionClick(addExpenseAction.value)
    return
  }

  hasOpenedExpenseDialog.value = true
  showExpenseDialog.value = true
}
</script>

<style lang="scss" scoped>
.mobile-action-shell {
  padding-bottom: calc(max(12px, env(safe-area-inset-bottom, 0px)) + var(--glass-bottom-offset));
}

.floating-bar {
  margin-bottom: 0;
  padding-top: 2px;
  padding-bottom: 2px;
}

.detail-mobile-menu-list {
  min-width: 180px;
}

.detail-mobile-menu-avatar {
  min-width: 36px;
}

.mobile-action-btn {
  border-radius: var(--radius-full);
  color: hsl(var(--foreground));
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.mobile-action-add-btn {
  background: hsl(var(--glass-fab-bg));
  color: hsl(var(--primary-foreground));
  border: 1px solid hsl(var(--glass-border-outer));
  box-shadow: var(--glass-fab-shadow);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.mobile-action-add-btn:focus-visible {
  outline: none;
  box-shadow:
    var(--glass-fab-shadow),
    0 0 0 3px hsl(var(--glass-focus-ring));
}

.mobile-slot-placeholder {
  min-height: 44px;
}

.floating-bar :deep(.q-btn__content .block) {
  white-space: nowrap;
}

@media (hover: hover) and (pointer: fine) {
  .mobile-action-btn:hover {
    background: hsl(var(--glass-active-bg));
  }

  .mobile-action-add-btn:hover {
    transform: translateY(-1px);
    background: hsl(var(--glass-fab-bg-hover));
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-action-btn,
  .mobile-action-add-btn {
    transition: none;
  }
}
</style>
