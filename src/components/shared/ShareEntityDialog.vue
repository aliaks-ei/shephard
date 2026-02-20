<template>
  <ShareDialog
    :model-value="modelValue"
    :entity-id="entityId"
    :entity-name="entityName"
    :shared-users="sharedUsers"
    :user-search-results="searchResults"
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
import { ref, computed, watch } from 'vue'
import ShareDialog from 'src/components/shared/ShareDialog.vue'
import {
  useSharedUsersQuery,
  useShareEntityMutation,
  useUnshareEntityMutation,
  useUpdatePermissionMutation,
  useSearchUsersQuery,
} from 'src/queries/sharing'
import { useUserStore } from 'src/stores/user'

const props = defineProps<{
  entityId: string
  entityType: 'plan' | 'template'
  entityName: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  shared: []
}>()

const userStore = useUserStore()
const userId = computed(() => userStore.userProfile?.id)

const reactiveEntityId = ref(props.entityId)
watch(
  () => props.entityId,
  (val) => {
    reactiveEntityId.value = val
  },
)

const searchQuery = ref('')
const { data: sharedUsersData, isFetching: isLoadingShares } = useSharedUsersQuery(
  props.entityType,
  reactiveEntityId,
)
const { data: searchData, isFetching: isSearching } = useSearchUsersQuery(searchQuery)
const shareMutation = useShareEntityMutation(props.entityType, userId)
const unshareMutation = useUnshareEntityMutation(props.entityType)
const updatePermissionMutation = useUpdatePermissionMutation(props.entityType)

const sharedUsers = computed(() => sharedUsersData.value ?? [])
const searchResults = computed(() => searchData.value ?? [])

function onSearchUsers(query: string) {
  searchQuery.value = query
}

function clearSearch() {
  searchQuery.value = ''
}

async function handleShareWithUser(entityId: string, email: string, permission: 'view' | 'edit') {
  await shareMutation.mutateAsync({ entityId, userEmail: email, permission })
  emit('shared')
}

async function handleUpdateUserPermission(
  entityId: string,
  targetUserId: string,
  permission: 'view' | 'edit',
) {
  await updatePermissionMutation.mutateAsync({
    entityId,
    userId: targetUserId,
    permission,
  })
}

async function handleRemoveUserAccess(entityId: string, targetUserId: string) {
  await unshareMutation.mutateAsync({ entityId, userId: targetUserId })
}
</script>
