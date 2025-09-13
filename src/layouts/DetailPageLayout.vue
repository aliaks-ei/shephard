<template>
  <div class="q-pa-sm q-pa-md-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8 col-xl-6">
        <q-toolbar class="q-mb-lg q-px-none">
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

        <q-breadcrumbs
          class="q-mb-lg text-grey-6"
          active-color="primary"
        >
          <q-breadcrumbs-el
            v-for="breadcrumb in breadcrumbs"
            :key="breadcrumb.label"
            :label="breadcrumb.label"
            :icon="breadcrumb.icon"
            :to="breadcrumb.to"
          />
        </q-breadcrumbs>

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

    <slot name="dialogs" />

    <slot name="fab" />
  </div>
</template>

<script setup lang="ts">
import PageBanners from 'src/components/shared/PageBanners.vue'

export interface BreadcrumbItem {
  label: string
  icon: string
  to?: string
}

export interface BannerConfig {
  type: string
  class: string
  icon: string
  message: string
}

const emit = defineEmits<{
  (e: 'back'): void
}>()

defineProps<{
  pageTitle: string
  pageIcon: string
  breadcrumbs: BreadcrumbItem[]
  banners?: BannerConfig[]
  isLoading?: boolean
}>()
</script>
