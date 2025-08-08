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
    @load-shared-users="templatesStore.loadTemplateShares"
    @share-with-user="templatesStore.shareTemplateWithUser"
    @update-user-permission="templatesStore.updateUserPermission"
    @remove-user-access="templatesStore.unshareTemplateWithUser"
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
</script>
