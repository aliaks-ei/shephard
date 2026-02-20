<template>
  <q-list
    class="rounded-borders"
    bordered
  >
    <q-item
      v-for="user in users"
      :key="user.user_id"
      class="q-py-xs q-px-sm"
    >
      <q-item-section>
        <div class="row items-center no-wrap">
          <q-avatar
            color="secondary"
            text-color="white"
            size="24px"
            class="text-caption q-mr-sm"
          >
            {{ getUserInitial(user.user_email) }}
            <q-tooltip>{{ user.user_email }}</q-tooltip>
          </q-avatar>
          <span class="ellipsis">
            {{ getUserDisplayName(user.user_name, user.user_email) }}
          </span>
        </div>
      </q-item-section>
      <q-item-section side>
        <div class="row items-center q-gutter-xs">
          <q-btn-toggle
            :model-value="user.permission_level"
            :options="permissionOptions"
            unelevated
            toggle-color="primary"
            size="sm"
            no-caps
            dense
            @update:model-value="
              (value: 'view' | 'edit') => emit('update:user-permission', user.user_id, value)
            "
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
import { useQuasar, Dialog } from 'quasar'

import { getUserInitial, getUserDisplayName } from 'src/utils/name'
import type { TemplateSharedUser } from 'src/api'

const $q = useQuasar()

const emit = defineEmits<{
  'update:user-permission': [userId: string, permission: 'view' | 'edit']
  'remove:user': [userId: string]
}>()

defineProps<{
  users: TemplateSharedUser[]
  permissionOptions: { label: string; value: string }[]
}>()

function showRemoveUserConfirmDialog(user: TemplateSharedUser) {
  Dialog.create({
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
      color: 'text-white',
    },
  }).onOk(() => {
    emit('remove:user', user.user_id)
  })
}
</script>
