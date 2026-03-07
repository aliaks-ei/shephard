<template>
  <!-- Desktop: Header Actions -->
  <div
    v-if="!isMobile && hasVisibleActions"
    class="row items-center q-gutter-sm"
  >
    <!-- Primary Actions (Solid background, no icons) -->
    <q-btn
      v-for="action in mainActions"
      :key="action.key"
      :label="action.label"
      :loading="action.loading"
      :disabled="action.loading"
      :color="action.color === 'negative' ? 'negative' : 'primary'"
      unelevated
      no-caps
      class="q-px-md rounded-borders"
      @click="handleActionClick(action)"
    />

    <!-- Overflow Menu for Secondary Actions -->
    <q-btn
      v-if="overflowActions.length > 0"
      flat
      round
      dense
      icon="eva-more-vertical-outline"
      color="grey-8"
    >
      <q-menu
        auto-close
        anchor="bottom right"
        self="top right"
        class="shadow-4"
      >
        <q-list style="min-width: 160px">
          <q-item
            v-for="action in overflowActions"
            :key="action.key"
            clickable
            @click="handleActionClick(action)"
          >
            <!-- Icons are kept here because they help scanning dropdown lists -->
            <q-item-section
              v-if="action.icon"
              avatar
              style="min-width: 36px"
            >
              <q-icon
                :name="action.icon"
                :color="action.color === 'negative' ? 'negative' : 'grey-7'"
                size="sm"
              />
            </q-item-section>

            <q-item-section :class="action.color === 'negative' ? 'text-negative' : ''">
              {{ action.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
  </div>

  <!-- Mobile: Bottom Action Bar -->
  <q-page-sticky
    v-if="isMobile && hasVisibleActions"
    position="bottom"
    expand
    :offset="[0, 0]"
  >
    <div class="full-width q-px-sm mobile-action-shell">
      <div
        class="q-pa-xs"
        :style="floatingBarStyle"
      >
        <!-- Main Actions -->
        <div class="row q-gutter-xs items-center">
          <div
            v-for="action in mainActions"
            :key="action.key"
            class="col"
          >
            <q-btn
              :icon="action.icon"
              :loading="action.loading"
              :label="action.label"
              :disabled="action.loading"
              :style="{ borderRadius: 'var(--radius-full)' }"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width"
              @click="handleActionClick(action)"
            />
          </div>

          <!-- Mobile Overflow Menu -->
          <div
            v-if="overflowActions.length > 0"
            class="col-auto"
          >
            <q-btn
              icon="eva-more-horizontal-outline"
              label="More"
              :style="{ borderRadius: 'var(--radius-full)' }"
              size="sm"
              flat
              stack
              dense
              no-caps
              class="full-width"
            >
              <q-menu
                auto-close
                anchor="top right"
                self="bottom right"
                class="shadow-4"
                :offset="[0, 10]"
              >
                <q-list style="min-width: 160px">
                  <q-item
                    v-for="action in overflowActions"
                    :key="action.key"
                    clickable
                    @click="handleActionClick(action)"
                  >
                    <q-item-section
                      v-if="action.icon"
                      avatar
                      style="min-width: 36px"
                    >
                      <q-icon
                        :name="action.icon"
                        :color="action.color === 'negative' ? 'negative' : 'grey-7'"
                        size="sm"
                      />
                    </q-item-section>

                    <q-item-section :class="action.color === 'negative' ? 'text-negative' : ''">
                      {{ action.label }}
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
      </div>
    </div>
  </q-page-sticky>
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue'
import { computed } from 'vue'
import { useQuasar } from 'quasar'

export interface ActionBarAction {
  key: string
  icon: string
  label: string
  color: string
  loading?: boolean
  visible?: boolean
  priority?: 'primary' | 'secondary'
  handler: () => void | Promise<void>
}

const emit = defineEmits<{
  (e: 'action-clicked', key: string): void
}>()

const props = defineProps<{
  actions: ActionBarAction[]
  visible?: boolean
}>()

const $q = useQuasar()

const isMobile = computed(() => $q.screen.lt.md)

const floatingBarStyle: StyleValue = {
  borderRadius: 'var(--radius-full)',
  background: 'hsl(var(--card))',
  boxShadow: 'var(--shadow-md)',
  border: '1px solid hsl(var(--border))',
  marginBottom: '0',
}

const visibleActions = computed(() => {
  return props.actions.filter((action) => action.visible !== false)
})

const hasVisibleActions = computed(() => {
  return props.visible !== false && visibleActions.value.length > 0
})

const mainActions = computed(() => {
  const primary = visibleActions.value.filter((a) => a.priority === 'primary')
  // Fallback: if no primary action is defined, just show the first one
  return primary.length > 0 ? primary : visibleActions.value.slice(0, 1)
})

const overflowActions = computed(() => {
  const mainKeys = new Set(mainActions.value.map((a) => a.key))
  return visibleActions.value.filter((a) => !mainKeys.has(a.key))
})

async function handleActionClick(action: ActionBarAction): Promise<void> {
  emit('action-clicked', action.key)
  await action.handler()
}
</script>

<style lang="scss" scoped>
.mobile-action-shell {
  padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
}
</style>
