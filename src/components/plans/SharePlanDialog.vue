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
    @shared="emit('shared')"
    @load-shared-users="loadSharedUsers"
    @share-with-user="shareWithUser"
    @update-user-permission="updateUserPermission"
    @remove-user-access="removeUserAccess"
    @search-users="searchUsers"
    @clear-user-search="clearUserSearch"
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

async function loadSharedUsers(planId: string) {
  await plansStore.loadSharedUsers(planId)
}

async function shareWithUser(planId: string, email: string, permission: 'view' | 'edit') {
  await plansStore.sharePlanWithUser(planId, email, permission)
}

async function updateUserPermission(planId: string, userId: string, permission: 'view' | 'edit') {
  await plansStore.updateUserPermission(planId, userId, permission)
}

async function removeUserAccess(planId: string, userId: string) {
  await plansStore.unsharePlanWithUser(planId, userId)
}

async function searchUsers(query: string) {
  await plansStore.searchUsers(query)
}

function clearUserSearch() {
  plansStore.clearUserSearch()
}
</script>
