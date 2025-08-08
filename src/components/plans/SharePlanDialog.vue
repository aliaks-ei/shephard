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
    @load-shared-users="plansStore.loadSharedUsers"
    @share-with-user="plansStore.sharePlanWithUser"
    @update-user-permission="plansStore.updateUserPermission"
    @remove-user-access="plansStore.unsharePlanWithUser"
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
</script>
