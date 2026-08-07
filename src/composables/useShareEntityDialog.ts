import { computed, ref, toRef } from 'vue'
import {
  useSearchUsersQuery,
  useSharedUsersQuery,
  useShareEntityMutation,
  useUnshareEntityMutation,
  useUpdatePermissionMutation,
} from 'src/queries/sharing'
import { useUserStore } from 'src/stores/user'
import { useNotificationEvents } from './useNotificationEvents'

type ShareEntityProps = {
  entityId: string
  entityType: 'plan' | 'template'
}

export function useShareEntityDialog(props: ShareEntityProps, onShared: () => void) {
  const userStore = useUserStore()
  const { emitNotificationEvent } = useNotificationEvents()
  const userId = computed(() => userStore.userProfile?.id)
  const entityId = toRef(props, 'entityId')
  const searchQuery = ref('')
  const { data: sharedUsersData, isFetching: isLoadingShares } = useSharedUsersQuery(
    props.entityType,
    entityId,
  )
  const { data: searchData, isFetching: isSearching } = useSearchUsersQuery(
    searchQuery,
    props.entityType,
    entityId,
  )
  const shareMutation = useShareEntityMutation(props.entityType, userId)
  const unshareMutation = useUnshareEntityMutation(props.entityType)
  const updatePermissionMutation = useUpdatePermissionMutation(props.entityType)
  const sharedUsers = computed(() => sharedUsersData.value ?? [])
  const searchResults = computed(() => searchData.value ?? [])

  async function handleShareWithUser(
    targetEntityId: string,
    targetUserId: string,
    email: string,
    permission: 'view' | 'edit',
  ) {
    await shareMutation.mutateAsync({ entityId: targetEntityId, userEmail: email, permission })
    await emitNotificationEvent({
      type: props.entityType === 'plan' ? 'plan_shared' : 'template_shared',
      entityType: props.entityType,
      entityId: targetEntityId,
      targetUserId,
      targetPermission: permission,
    })
    onShared()
  }

  async function handleUpdateUserPermission(
    targetEntityId: string,
    targetUserId: string,
    permission: 'view' | 'edit',
  ) {
    await updatePermissionMutation.mutateAsync({
      entityId: targetEntityId,
      userId: targetUserId,
      permission,
    })
    await emitNotificationEvent({
      type:
        props.entityType === 'plan'
          ? 'shared_plan_permission_changed'
          : 'shared_template_permission_changed',
      entityType: props.entityType,
      entityId: targetEntityId,
      targetUserId,
      targetPermission: permission,
    })
  }

  async function handleRemoveUserAccess(targetEntityId: string, targetUserId: string) {
    await unshareMutation.mutateAsync({ entityId: targetEntityId, userId: targetUserId })
    await emitNotificationEvent({
      type: props.entityType === 'plan' ? 'shared_plan_removed' : 'shared_template_removed',
      entityType: props.entityType,
      entityId: targetEntityId,
      targetUserId,
    })
  }

  return {
    shareMutation,
    sharedUsers,
    searchResults,
    isLoadingShares,
    isSearching,
    onSearchUsers: (query: string) => (searchQuery.value = query),
    clearSearch: () => (searchQuery.value = ''),
    handleShareWithUser,
    handleUpdateUserPermission,
    handleRemoveUserAccess,
  }
}
