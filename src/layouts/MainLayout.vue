<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      class="bg-primary text-white"
      elevated
    >
      <q-toolbar>
        <q-btn
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
      :mini="miniState"
      class="q-py-md"
      show-if-above
      bordered
      @mouseenter="miniState = false"
      @mouseleave="miniState = true"
      @focusin="miniState = false"
      @focusout="miniState = true"
    >
      <q-list>
        <q-item
          to="/"
          clickable
          v-ripple
          exact
        >
          <q-item-section avatar>
            <q-icon name="eva-home-outline" />
          </q-item-section>
          <q-item-section> Home </q-item-section>
        </q-item>

        <q-item
          to="/templates"
          clickable
          v-ripple
        >
          <q-item-section avatar>
            <q-icon name="eva-file-text-outline" />
          </q-item-section>
          <q-item-section> Templates </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserDropdownMenu from 'src/components/UserDropdownMenu.vue'

const leftDrawerOpen = ref(false)
const miniState = ref(true)

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
