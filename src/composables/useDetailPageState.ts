import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { getEntityLoadErrorKind } from 'src/api'

export type DetailLoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T | null }
  | { status: 'not-found' }
  | { status: 'denied' }
  | { status: 'error'; error: unknown }

export function resolveDetailLoadState<T>(input: {
  isNew: boolean
  isPending: boolean
  data: T | null
  isError: boolean
  error: unknown
  isOnline?: boolean
}): DetailLoadState<T> {
  if (input.isNew) return { status: 'ready', data: null }
  if (input.data) return { status: 'ready', data: input.data }
  if (input.isOnline === false) {
    return { status: 'error', error: new Error('Offline') }
  }
  if (input.isPending) return { status: 'loading' }

  if (input.isError) {
    const kind = getEntityLoadErrorKind(input.error)
    if (kind === 'not-found') return { status: 'not-found' }
    if (kind === 'access-denied') return { status: 'denied' }
    return { status: 'error', error: input.error }
  }

  return { status: 'loading' }
}

export interface DetailPageConfig {
  entityName: string
  entityNamePlural: string
  listRoute: string
  listIcon: string
}

export function useDetailPageState(
  config: DetailPageConfig,
  isNew: MaybeRefOrGetter<boolean>,
  isReadOnly: MaybeRefOrGetter<boolean>,
) {
  const pageTitle = computed(() => {
    if (toValue(isNew)) return `Create ${config.entityName}`
    if (toValue(isReadOnly)) return `View ${config.entityName}`
    return `Edit ${config.entityName}`
  })

  return {
    pageTitle,
  }
}
