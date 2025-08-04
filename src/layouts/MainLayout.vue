<template>
  <q-layout view="lHh Lpr fff">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          v-if="!$q.screen.gt.sm"
          icon="eva-menu-outline"
          aria-label="Menu"
          flat
          round
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>
          <q-btn
            class="text-h6"
            label="Shephard"
            to="/"
            flat
            no-caps
          />
        </q-toolbar-title>

        <UserDropdownMenu />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      class="q-py-md"
      bordered
      behavior="mobile"
    >
      <NavigationDrawer :items="navigationItems" />
    </q-drawer>

    <q-page-container class="page-container">
      <q-page
        class="shadow-1"
        padding
      >
        <router-view />
      </q-page>

      <q-page-sticky
        v-if="$q.screen.gt.sm"
        position="left"
        class="navigation-sticky-bg"
        expand
      >
        <NavigationDrawer
          class="fit q-py-xl q-px-sm"
          :items="navigationItems"
          is-mini-mode
        />
      </q-page-sticky>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import UserDropdownMenu from 'src/components/UserDropdownMenu.vue'
import NavigationDrawer from 'src/components/NavigationDrawer.vue'

const leftDrawerOpen = ref(false)
const navigationItems = ref([
  {
    icon: 'eva-calendar-outline',
    label: 'Plans',
    to: '/plans',
  },
  {
    icon: 'eva-file-text-outline',
    label: 'Templates',
    to: '/templates',
  },
  {
    icon: 'eva-grid-outline',
    label: 'Categories',
    to: '/categories',
  },
])

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style lang="scss" scoped>
.navigation-sticky-bg {
  background-color: var(--bg-color);
}

@media (min-width: 1024px) {
  .page-container {
    padding-left: 115px;
  }
}
</style>
