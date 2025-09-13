<template>
  <div :class="{ 'mobile-content-spacing': isMobile && hasActions }">
    <!-- Mobile: Full width toolbar -->
    <div
      v-if="isMobile"
      class="q-pa-sm"
    >
      <q-toolbar class="q-mb-sm q-px-none">
        <q-btn
          flat
          round
          icon="eva-arrow-back-outline"
          @click="emit('back')"
        />

        <q-toolbar-title>
          <div class="row items-center">
            <q-icon
              :name="pageIcon"
              size="sm"
              class="q-mr-sm"
            />
            {{ pageTitle }}
          </div>
        </q-toolbar-title>
      </q-toolbar>

      <PageBanners :banners="banners || []" />

      <div v-if="isLoading">
        <div class="q-pa-lg">
          <q-skeleton
            type="text"
            width="40%"
            class="q-mb-md"
          />
          <q-skeleton
            type="QInput"
            class="q-mb-lg"
          />
          <q-skeleton
            type="text"
            width="30%"
            class="q-mb-md"
          />
          <q-skeleton
            type="rect"
            height="50px"
            class="q-mb-lg"
          />
          <q-skeleton
            type="text"
            width="35%"
            class="q-mb-md"
          />
          <q-skeleton
            type="rect"
            height="200px"
          />
        </div>
      </div>

      <div v-else>
        <slot />
      </div>
    </div>

    <!-- Desktop: Centered layout -->
    <div
      v-else
      class="q-pa-sm q-pa-md-md"
    >
      <div class="row justify-center">
        <div class="col-12 col-md-10 col-lg-8 col-xl-6">
          <q-toolbar
            class="q-mb-lg q-px-none shadow-1 q-pa-md sticky-toolbar"
            :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white'"
          >
            <q-btn
              flat
              round
              icon="eva-arrow-back-outline"
              @click="emit('back')"
            />

            <q-toolbar-title>
              <div class="row items-center">
                <q-icon
                  :name="pageIcon"
                  size="sm"
                  class="q-mr-sm"
                />
                {{ pageTitle }}
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

          <PageBanners :banners="banners || []" />

          <div v-if="isLoading">
            <div class="q-pa-lg">
              <q-skeleton
                type="text"
                width="40%"
                class="q-mb-md"
              />
              <q-skeleton
                type="QInput"
                class="q-mb-lg"
              />
              <q-skeleton
                type="text"
                width="30%"
                class="q-mb-md"
              />
              <q-skeleton
                type="rect"
                height="50px"
                class="q-mb-lg"
              />
              <q-skeleton
                type="text"
                width="35%"
                class="q-mb-md"
              />
              <q-skeleton
                type="rect"
                height="200px"
              />
            </div>
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
  pageIcon: string
  banners?: BannerConfig[]
  isLoading?: boolean
  actions?: ActionBarAction[]
  actionsVisible?: boolean
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
    padding-bottom: 80px;
  }
}

.sticky-toolbar {
  position: sticky;
  top: 52px;
  z-index: 100;
}
</style>
