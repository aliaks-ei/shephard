<template>
  <ShareDialog
    :model-value="modelValue"
    :entity-id="entityId"
    :entity-name="entityName"
    :shared-users="sharedUsers"
    :user-search-results="searchResults"
    :owner-user-id="ownerUserId"
    :is-sharing="shareMutation.isPending.value"
    :is-searching-users="isSearching"
    :is-loading-shares="isLoadingShares"
    @update:model-value="emit('update:modelValue', $event)"
    @share-with-user="handleShareWithUser"
    @update-user-permission="handleUpdateUserPermission"
    @remove-user-access="handleRemoveUserAccess"
    @search-users="onSearchUsers"
    @clear-user-search="clearSearch"
  />
</template>

<script setup lang="ts">
import ShareDialog from 'src/components/shared/ShareDialog.vue'
import { useShareEntityDialog } from 'src/composables/useShareEntityDialog'

const props = defineProps<{
  entityId: string
  entityType: 'plan' | 'template'
  entityName: string
  ownerUserId: string | undefined
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  shared: []
}>()

const {
  shareMutation,
  sharedUsers,
  searchResults,
  isLoadingShares,
  isSearching,
  onSearchUsers,
  clearSearch,
  handleShareWithUser,
  handleUpdateUserPermission,
  handleRemoveUserAccess,
} = useShareEntityDialog(props, () => emit('shared'))
</script>
