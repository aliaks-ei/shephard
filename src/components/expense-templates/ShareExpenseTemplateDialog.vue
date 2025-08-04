<template>
  <ShareDialog
    :model-value="modelValue"
    :entity-id="templateId"
    entity-name="Template"
    :shared-users="templatesStore.sharedUsers"
    :user-search-results="templatesStore.userSearchResults"
    :is-sharing="templatesStore.isSharing"
    :is-searching-users="templatesStore.isSearchingUsers"
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
import { useTemplatesStore } from 'src/stores/templates'

defineProps<{
  templateId: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shared'): void
}>()

const templatesStore = useTemplatesStore()

async function loadSharedUsers(templateId: string) {
  await templatesStore.loadTemplateShares(templateId)
}

async function shareWithUser(templateId: string, email: string, permission: 'view' | 'edit') {
  await templatesStore.shareTemplateWithUser(templateId, email, permission)
}

async function updateUserPermission(
  templateId: string,
  userId: string,
  permission: 'view' | 'edit',
) {
  await templatesStore.updateUserPermission(templateId, userId, permission)
}

async function removeUserAccess(templateId: string, userId: string) {
  await templatesStore.unshareTemplateWithUser(templateId, userId)
}

async function searchUsers(query: string) {
  await templatesStore.searchUsers(query)
}

function clearUserSearch() {
  templatesStore.clearUserSearch()
}
</script>
