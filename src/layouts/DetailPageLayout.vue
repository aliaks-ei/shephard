<template>
  <div :class="{ 'mobile-content-spacing': isMobile && hasActions }">
    <!-- Mobile: Full width toolbar -->
    <div
      v-if="isMobile"
      class="page-content-spacing"
    >
      <q-toolbar class="q-mb-sm q-px-none">
        <q-btn
          flat
          round
          size="sm"
          icon="eva-arrow-back-outline"
          aria-label="Go back"
          class="detail-back-button"
          @click="emit('back')"
        />

        <q-toolbar-title>
          <div class="row items-center no-wrap text-body1">
            {{ pageTitle }}
            <q-badge
              v-if="showReadOnlyBadge && effectiveLoadState === 'ready'"
              color="orange"
              text-color="white"
              class="q-ml-sm"
              outline
            >
              <q-icon
                name="eva-eye-outline"
                class="q-mr-xs"
              />
              view only
            </q-badge>
          </div>
        </q-toolbar-title>
      </q-toolbar>

      <BannerContainer />

      <PageBanners
        v-if="effectiveLoadState === 'ready'"
        :banners="banners || []"
      />

      <div v-if="effectiveLoadState === 'loading'">
        <!-- Tabs placeholder -->
        <div class="row q-mb-md">
          <q-skeleton
            v-for="n in 3"
            :key="n"
            type="text"
            width="80px"
            height="36px"
            class="q-mr-md"
          />
        </div>
        <q-skeleton
          type="rect"
          height="2px"
          class="q-mb-md"
        />

        <!-- Summary card placeholder -->
        <q-skeleton
          type="rect"
          height="120px"
          class="q-mb-md rounded-borders"
        />

        <!-- Content cards placeholder -->
        <q-skeleton
          type="rect"
          height="80px"
          class="q-mb-sm rounded-borders"
        />
        <q-skeleton
          type="rect"
          height="80px"
          class="rounded-borders"
        />
      </div>

      <QueryErrorState
        v-else-if="effectiveLoadState !== 'ready'"
        :kind="terminalLoadState"
        :entity-name="entityName ?? 'Item'"
        :show-retry="effectiveLoadState === 'error'"
        :retrying="retrying ?? false"
        show-back
        :back-label="`Back to ${entityNamePlural ?? 'items'}`"
        @retry="emit('retry')"
        @back="emit('back')"
      />

      <div v-else>
        <slot />
      </div>
    </div>

    <!-- Desktop: Centered layout -->
    <div
      v-else
      class="page-content-spacing"
    >
      <div class="row justify-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <q-toolbar
            class="q-mb-lg q-px-md q-py-sm sticky-toolbar detail-toolbar liquid-glass-surface"
          >
            <q-btn
              flat
              round
              icon="eva-arrow-back-outline"
              aria-label="Go back"
              class="detail-back-button"
              @click="emit('back')"
            />

            <q-toolbar-title class="detail-title-basis">
              <div class="row items-center no-wrap">
                {{ pageTitle }}
                <q-badge
                  v-if="showReadOnlyBadge && effectiveLoadState === 'ready'"
                  color="orange"
                  text-color="white"
                  class="q-ml-sm"
                  outline
                >
                  <q-icon
                    name="eva-eye-outline"
                    class="q-mr-xs"
                  />
                  view only
                </q-badge>
              </div>
            </q-toolbar-title>

            <q-space />

            <!-- Desktop Actions -->
            <ActionBar
              :actions="actions || []"
              :visible="actionsVisible !== false && effectiveLoadState === 'ready'"
              @action-clicked="emit('action-clicked', $event)"
            />
          </q-toolbar>

          <BannerContainer />

          <PageBanners
            v-if="effectiveLoadState === 'ready'"
            :banners="banners || []"
          />

          <div v-if="effectiveLoadState === 'loading'">
            <!-- Tabs placeholder -->
            <div class="row q-mb-md">
              <q-skeleton
                v-for="n in 3"
                :key="n"
                type="text"
                width="100px"
                height="40px"
                class="q-mr-lg"
              />
            </div>
            <q-skeleton
              type="rect"
              height="2px"
              class="q-mb-lg"
            />

            <!-- Summary card placeholder -->
            <q-skeleton
              type="rect"
              height="140px"
              class="q-mb-md rounded-borders"
            />

            <!-- Content cards placeholder -->
            <q-skeleton
              type="rect"
              height="90px"
              class="q-mb-sm rounded-borders"
            />
            <q-skeleton
              type="rect"
              height="90px"
              class="rounded-borders"
            />
          </div>

          <QueryErrorState
            v-else-if="effectiveLoadState !== 'ready'"
            :kind="terminalLoadState"
            :entity-name="entityName ?? 'Item'"
            :show-retry="effectiveLoadState === 'error'"
            :retrying="retrying ?? false"
            show-back
            :back-label="`Back to ${entityNamePlural ?? 'items'}`"
            @retry="emit('retry')"
            @back="emit('back')"
          />

          <div v-else>
            <slot />
          </div>
        </div>
      </div>
    </div>

    <slot name="dialogs" />

    <!-- Mobile Actions Only -->
    <DetailMobileActionBar
      v-if="isMobile"
      :actions="actions || []"
      :visible="actionsVisible !== false && effectiveLoadState === 'ready'"
      @action-clicked="emit('action-clicked', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import PageBanners from 'src/components/shared/PageBanners.vue'
import BannerContainer from 'src/components/shared/BannerContainer.vue'
import ActionBar from 'src/components/shared/ActionBar.vue'
import DetailMobileActionBar from 'src/components/shared/DetailMobileActionBar.vue'
import QueryErrorState from 'src/components/shared/QueryErrorState.vue'
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'
import type { QueryErrorStateKind } from 'src/components/shared/QueryErrorState.vue'

export interface BannerConfig {
  type: string
  class: string
  icon: string
  message: string
}

type DetailPageLoadState = 'loading' | 'ready' | 'not-found' | 'denied' | 'error'

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'retry'): void
  (e: 'action-clicked', key: string): void
}>()

const props = withDefaults(
  defineProps<{
    pageTitle: string
    banners?: BannerConfig[]
    isLoading?: boolean
    loadState?: DetailPageLoadState
    retrying?: boolean
    entityName?: string
    entityNamePlural?: string
    actions?: ActionBarAction[]
    actionsVisible?: boolean
    showReadOnlyBadge?: boolean
  }>(),
  {
    actionsVisible: true,
    entityName: 'Item',
    entityNamePlural: 'items',
    isLoading: false,
    retrying: false,
  },
)

const $q = useQuasar()

const isMobile = computed(() => $q.screen.lt.md)
const effectiveLoadState = computed(
  () => props.loadState ?? (props.isLoading ? 'loading' : 'ready'),
)
const terminalLoadState = computed<QueryErrorStateKind>(() => {
  if (effectiveLoadState.value === 'not-found') return 'not-found'
  if (effectiveLoadState.value === 'denied') return 'denied'
  return 'error'
})

const hasActions = computed(() => {
  if (props.actionsVisible === false || effectiveLoadState.value !== 'ready') {
    return false
  }

  const actions = props.actions ?? []
  return actions.some((action) => action.visible !== false)
})
</script>

<style lang="scss" scoped>
.mobile-content-spacing {
  @media (max-width: 1023px) {
    padding-bottom: calc(
      72px + max(12px, env(safe-area-inset-bottom, 0px)) + var(--glass-bottom-offset)
    );
  }
}

.sticky-toolbar {
  position: sticky;
  top: 52px;
  z-index: 100;
}

.detail-toolbar {
  color: hsl(var(--foreground));
}

.detail-title-basis {
  flex-basis: 30%;
}

.detail-back-button {
  min-width: 44px;
  min-height: 44px;
}
</style>
