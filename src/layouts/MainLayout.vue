<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      class="bg-primary text-white"
    >
      <q-toolbar>
        <q-toolbar-title>
          <q-btn
            to="/"
            flat
            no-caps
            class="text-white text-h6"
            label="Shephard"
          />
        </q-toolbar-title>

        <UserDropdownMenu />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import UserDropdownMenu from 'src/components/UserDropdownMenu.vue'
</script>
