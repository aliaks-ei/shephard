<template>
  <ShareDialog
    :model-value="modelValue"
    :entity-id="planId"
    entity-name="Plan"
    :shared-users="plansStore.sharedUsers"
    :user-search-results="plansStore.userSearchResults"
    :is-sharing="plansStore.isSharing"
    :is-searching-users="plansStore.isSearchingUsers"
    @update:model-value="emit('update:modelValue', $event)"
    @load-shared-users="plansStore.loadSharedUsers"
    @share-with-user="handleShareWithUser"
    @update-user-permission="handleUpdateUserPermission"
    @remove-user-access="handleRemoveUserAccess"
    @search-users="plansStore.searchUsers"
    @clear-user-search="plansStore.clearUserSearch"
  />
</template>

<script setup lang="ts">
import ShareDialog from 'src/components/shared/ShareDialog.vue'
import { usePlansStore } from 'src/stores/plans'

defineProps<{
  planId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shared'): void
}>()

const plansStore = usePlansStore()

async function handleShareWithUser(planId: string, email: string, permission: 'view' | 'edit') {
  const result = await plansStore.sharePlanWithUser(planId, email, permission)

  if (result.success) {
    emit('shared')
  }
}

async function handleUpdateUserPermission(
  planId: string,
  userId: string,
  permission: 'view' | 'edit',
) {
  await plansStore.updateUserPermission(planId, userId, permission)
}

async function handleRemoveUserAccess(planId: string, userId: string) {
  await plansStore.unsharePlanWithUser(planId, userId)
}
</script>
