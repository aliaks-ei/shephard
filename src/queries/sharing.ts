import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getTemplateSharedUsers,
  shareTemplate,
  unshareTemplate,
  updateSharePermission as updateTemplateSharePermission,
  getPlanSharedUsers,
  sharePlan,
  unsharePlan,
  updatePlanSharePermission,
  searchUsersByEmail,
} from 'src/api'
import { useUserStore } from 'src/stores/user'
import { createMutationErrorHandler, createSpecificErrorHandler } from './query-error-handler'
import { queryKeys } from './query-keys'
import type { ErrorMessageKey } from 'src/config/error-messages'

type EntityType = 'plan' | 'template'

const sharingApiMap = {
  plan: {
    loadSharedUsers: getPlanSharedUsers,
    share: sharePlan,
    unshare: unsharePlan,
    updatePermission: updatePlanSharePermission,
    sharedUsersKey: (id: string) => queryKeys.plans.sharedUsers(id),
    listKey: (userId: string) => queryKeys.plans.list(userId),
    errorPrefix: 'PLANS' as const,
    handleSpecificErrors: true,
  },
  template: {
    loadSharedUsers: getTemplateSharedUsers,
    share: shareTemplate,
    unshare: unshareTemplate,
    updatePermission: updateTemplateSharePermission,
    sharedUsersKey: (id: string) => queryKeys.templates.sharedUsers(id),
    listKey: (userId: string) => queryKeys.templates.list(userId),
    errorPrefix: 'TEMPLATES' as const,
    handleSpecificErrors: false,
  },
} as const

function invalidateSharingQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  api: (typeof sharingApiMap)[EntityType],
  entityId: string,
  userId: string | undefined,
): void {
  queryClient.invalidateQueries({ queryKey: api.sharedUsersKey(entityId) })
  if (userId) {
    queryClient.invalidateQueries({ queryKey: api.listKey(userId) })
  }
}

export function useSharedUsersQuery(entityType: EntityType, entityId: MaybeRefOrGetter<string>) {
  const api = sharingApiMap[entityType]

  return useQuery({
    queryKey: computed(() => api.sharedUsersKey(toValue(entityId))),
    queryFn: () => api.loadSharedUsers(toValue(entityId)),
    enabled: computed(() => !!toValue(entityId)),
    meta: { errorKey: `${api.errorPrefix}.LOAD_SHARED_USERS_FAILED` as ErrorMessageKey },
  })
}

export function useShareEntityMutation(
  entityType: EntityType,
  userId: MaybeRefOrGetter<string | undefined>,
) {
  const queryClient = useQueryClient()
  const api = sharingApiMap[entityType]

  const errorHandler = api.handleSpecificErrors
    ? createSpecificErrorHandler(
        [
          {
            check: (e) => e.message.includes('User not found'),
            key: `${api.errorPrefix}.USER_NOT_FOUND` as ErrorMessageKey,
          },
          {
            check: (e) => e.message.includes('already shared'),
            key: `${api.errorPrefix}.ALREADY_SHARED` as ErrorMessageKey,
          },
        ],
        `${api.errorPrefix}.SHARE_FAILED` as ErrorMessageKey,
      )
    : createMutationErrorHandler(`${api.errorPrefix}.SHARE_FAILED` as ErrorMessageKey)

  return useMutation({
    mutationFn: (vars: { entityId: string; userEmail: string; permission: 'view' | 'edit' }) =>
      api.share(vars.entityId, vars.userEmail, vars.permission, toValue(userId)!),
    onSuccess: (_data, vars) => {
      invalidateSharingQueries(queryClient, api, vars.entityId, toValue(userId))
    },
    onError: errorHandler,
  })
}

export function useUnshareEntityMutation(entityType: EntityType) {
  const queryClient = useQueryClient()
  const userStore = useUserStore()
  const api = sharingApiMap[entityType]

  return useMutation({
    mutationFn: (vars: { entityId: string; userId: string }) =>
      api.unshare(vars.entityId, vars.userId),
    onSuccess: (_data, vars) => {
      invalidateSharingQueries(queryClient, api, vars.entityId, userStore.userProfile?.id)
    },
    onError: createMutationErrorHandler(`${api.errorPrefix}.UNSHARE_FAILED` as ErrorMessageKey),
  })
}

export function useUpdatePermissionMutation(entityType: EntityType) {
  const queryClient = useQueryClient()
  const api = sharingApiMap[entityType]

  return useMutation({
    mutationFn: (vars: { entityId: string; userId: string; permission: 'view' | 'edit' }) =>
      api.updatePermission(vars.entityId, vars.userId, vars.permission),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: api.sharedUsersKey(vars.entityId) })
    },
    onError: createMutationErrorHandler(
      `${api.errorPrefix}.UPDATE_PERMISSION_FAILED` as ErrorMessageKey,
    ),
  })
}

export function useSearchUsersQuery(
  query: MaybeRefOrGetter<string>,
  entityType: EntityType,
  entityId: MaybeRefOrGetter<string>,
) {
  return useQuery({
    queryKey: computed(() => queryKeys.users.search(entityType, toValue(entityId), toValue(query))),
    queryFn: () =>
      searchUsersByEmail(toValue(query), {
        entityType,
        entityId: toValue(entityId),
      }),
    enabled: computed(() => !!toValue(entityId) && toValue(query).trim().length > 0),
    staleTime: 30 * 1000,
    meta: { errorKey: 'USERS.SEARCH_FAILED' as const },
  })
}
