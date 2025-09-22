<template>
  <q-list
    class="rounded-borders"
    bordered
  >
    <q-item
      v-for="user in users"
      :key="user.user_id"
      class="q-pa-sm"
    >
      <q-item-section avatar>
        <q-avatar
          color="secondary"
          text-color="white"
          size="32px"
        >
          {{ getUserInitial(user.user_email) }}
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label>
          {{ getUserDisplayName(user.user_name, user.user_email) }}
        </q-item-label>
        <q-item-label caption>{{ user.user_email }}</q-item-label>
        <q-item-label caption> Shared {{ formatDate(user.shared_at) }} </q-item-label>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center q-gutter-sm">
          <q-select
            :model-value="user.permission_level"
            :options="permissionOptions"
            outlined
            dense
            emit-value
            map-options
            style="min-width: 100px"
            @update:model-value="(value) => emit('update:user-permission', user.user_id, value)"
          />
          <q-btn
            icon="eva-trash-2-outline"
            flat
            round
            size="sm"
            color="negative"
            @click="showRemoveUserConfirmDialog(user)"
          >
            <q-tooltip v-if="!$q.screen.lt.md">Remove access</q-tooltip>
          </q-btn>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { date, useQuasar } from 'quasar'

import { getUserInitial, getUserDisplayName } from 'src/utils/name'
import type { TemplateSharedUser } from 'src/api'

const emit = defineEmits<{
  (e: 'update:user-permission', userId: string, permission: 'view' | 'edit'): void
  (e: 'remove:user', userId: string): void
}>()

defineProps<{
  users: TemplateSharedUser[]
  permissionOptions: { label: string; value: string }[]
}>()

const $q = useQuasar()

function formatDate(dateString: string): string {
  return date.formatDate(dateString, 'MMM D, YYYY')
}

function showRemoveUserConfirmDialog(user: TemplateSharedUser) {
  $q.dialog({
    title: 'Remove Access',
    message: `Are you sure you want to remove access for ${user.user_name || user.user_email}?`,
    persistent: true,
    ok: {
      label: 'Remove',
      color: 'negative',
      unelevated: true,
    },
    cancel: {
      label: 'Cancel',
      flat: true,
    },
  }).onOk(() => {
    emit('remove:user', user.user_id)
  })
}
</script>
