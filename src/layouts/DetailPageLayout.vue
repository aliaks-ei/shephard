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
          @click="emit('back')"
        />

        <q-toolbar-title>
          <div class="row items-center no-wrap text-body1">
            {{ pageTitle }}
          </div>
        </q-toolbar-title>
      </q-toolbar>

      <BannerContainer />

      <PageBanners
        v-if="!isLoading"
        :banners="banners || []"
      />

      <div v-if="isLoading">
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
        <div class="col-12 col-md-10 col-lg-8 col-xl-6">
          <q-toolbar class="q-mb-lg q-px-none shadow-1 q-pa-md sticky-toolbar detail-toolbar">
            <q-btn
              flat
              round
              icon="eva-arrow-back-outline"
              @click="emit('back')"
            />

            <q-toolbar-title style="flex-basis: 30%">
              <div class="row items-center no-wrap">
                {{ pageTitle }}
                <q-badge
                  v-if="showReadOnlyBadge && !isLoading"
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
              :visible="!!actionsVisible"
              @action-clicked="emit('action-clicked', $event)"
            />
          </q-toolbar>

          <BannerContainer />

          <PageBanners
            v-if="!isLoading"
            :banners="banners || []"
          />

          <div v-if="isLoading">
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

          <div v-else>
            <slot />
          </div>
        </div>
      </div>
    </div>

    <slot name="dialogs" />

    <!-- Mobile Actions Only -->
    <ActionBar
      v-if="isMobile"
      :actions="actions || []"
      :visible="!!actionsVisible"
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
import type { ActionBarAction } from 'src/components/shared/ActionBar.vue'

export interface BannerConfig {
  type: string
  class: string
  icon: string
  message: string
}

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'action-clicked', key: string): void
}>()

const props = defineProps<{
  pageTitle: string
  banners?: BannerConfig[]
  isLoading?: boolean
  actions?: ActionBarAction[]
  actionsVisible?: boolean
  showReadOnlyBadge?: boolean
}>()

const $q = useQuasar()

const isMobile = computed(() => $q.screen.lt.md)

const hasActions = computed(() => {
  return props.actionsVisible !== false && (props.actions?.length || 0) > 0
})
</script>

<style lang="scss" scoped>
.mobile-content-spacing {
  @media (max-width: 1023px) {
    padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  }
}

.sticky-toolbar {
  position: sticky;
  top: 52px;
  z-index: 100;
}

.detail-toolbar {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
}
</style>
