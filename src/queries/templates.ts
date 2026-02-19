import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import {
  getTemplates,
  getTemplateWithItems,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTemplateItems,
  deleteTemplateItems,
  type TemplateInsert,
  type TemplateUpdate,
  type TemplateWithPermission,
  type TemplateItemInsert,
} from 'src/api'
import { useUserStore } from 'src/stores/user'
import { queryKeys } from './query-keys'
import { createSpecificErrorHandler, createMutationErrorHandler } from './query-error-handler'

function invalidateTemplateQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  templateId?: string,
) {
  const userStore = useUserStore()
  const userId = userStore.userProfile?.id ?? ''

  queryClient.invalidateQueries({ queryKey: queryKeys.templates.list(userId) })
  if (templateId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(templateId, userId) })
  }
}

export function useTemplatesQuery(userId: MaybeRefOrGetter<string | undefined>) {
  const query = useQuery({
    queryKey: computed(() => queryKeys.templates.list(toValue(userId) ?? '')),
    queryFn: () => getTemplates(toValue(userId)!),
    enabled: computed(() => !!toValue(userId)),
    meta: { errorKey: 'TEMPLATES.LOAD_FAILED' as const },
  })

  const templates = computed((): TemplateWithPermission[] => query.data.value ?? [])
  const templatesCount = computed(() => templates.value.length)
  const ownedTemplates = computed(() =>
    templates.value.filter((t) => t.owner_id === toValue(userId)),
  )
  const sharedTemplates = computed(() =>
    templates.value.filter((t) => t.owner_id !== toValue(userId)),
  )

  return {
    ...query,
    templates,
    templatesCount,
    ownedTemplates,
    sharedTemplates,
  }
}

export function useTemplateDetailQuery(
  templateId: MaybeRefOrGetter<string | null>,
  userId: MaybeRefOrGetter<string | undefined>,
) {
  return useQuery({
    queryKey: computed(() =>
      queryKeys.templates.detail(toValue(templateId) ?? '', toValue(userId) ?? ''),
    ),
    queryFn: () => getTemplateWithItems(toValue(templateId)!, toValue(userId)!),
    enabled: computed(() => !!toValue(templateId) && !!toValue(userId)),
    meta: { errorKey: 'TEMPLATES.LOAD_TEMPLATE_FAILED' as const },
  })
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: TemplateInsert) => createTemplate(template),
    onSuccess: () => {
      invalidateTemplateQueries(queryClient)
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) => e.name === 'DUPLICATE_TEMPLATE_NAME',
          key: 'TEMPLATES.DUPLICATE_NAME',
        },
      ],
      'TEMPLATES.CREATE_FAILED',
    ),
  })
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { id: string; updates: TemplateUpdate }) =>
      updateTemplate(vars.id, vars.updates),
    onSuccess: (_data, vars) => {
      invalidateTemplateQueries(queryClient, vars.id)
    },
    onError: createSpecificErrorHandler(
      [
        {
          check: (e) => e.name === 'DUPLICATE_TEMPLATE_NAME',
          key: 'TEMPLATES.DUPLICATE_NAME',
        },
      ],
      'TEMPLATES.UPDATE_FAILED',
    ),
  })
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      invalidateTemplateQueries(queryClient)
    },
    onError: createMutationErrorHandler('TEMPLATES.DELETE_FAILED'),
  })
}

export function useCreateTemplateItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { templateId: string; items: TemplateItemInsert[] }) =>
      createTemplateItems(vars.items),
    onSuccess: (_data, vars) => {
      invalidateTemplateQueries(queryClient, vars.templateId)
    },
    onError: createMutationErrorHandler('TEMPLATE_ITEMS.CREATE_FAILED'),
  })
}

export function useDeleteTemplateItemsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vars: { templateId: string; ids: string[] }) => deleteTemplateItems(vars.ids),
    onSuccess: (_data, vars) => {
      invalidateTemplateQueries(queryClient, vars.templateId)
    },
    onError: createMutationErrorHandler('TEMPLATE_ITEMS.DELETE_FAILED'),
  })
}
