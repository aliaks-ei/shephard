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
    @load-shared-users="templatesStore.loadTemplateShares"
    @share-with-user="handleShareWithUser"
    @update-user-permission="handleUpdateUserPermission"
    @remove-user-access="handleRemoveUserAccess"
    @search-users="templatesStore.searchUsers"
    @clear-user-search="templatesStore.clearUserSearch"
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

async function handleShareWithUser(templateId: string, email: string, permission: 'view' | 'edit') {
  const result = await templatesStore.shareTemplateWithUser(templateId, email, permission)

  if (result.success) {
    emit('shared')
  }
}

async function handleUpdateUserPermission(
  templateId: string,
  userId: string,
  permission: 'view' | 'edit',
) {
  await templatesStore.updateUserPermission(templateId, userId, permission)
}

async function handleRemoveUserAccess(templateId: string, userId: string) {
  await templatesStore.unshareTemplateWithUser(templateId, userId)
}
</script>
