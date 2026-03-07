import { computed, toValue, type MaybeRefOrGetter } from 'vue'

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
