import { computed } from 'vue'
import type { BannerConfig } from 'src/layouts/DetailPageLayout.vue'

export interface DetailPageConfig {
  entityName: string
  entityNamePlural: string
  listRoute: string
  listIcon: string
  createIcon: string
  editIcon: string
  viewIcon: string
}

export function useDetailPageState(config: DetailPageConfig, isNew: boolean, isReadOnly: boolean) {
  const pageTitle = computed(() => {
    if (isNew) return `Create ${config.entityName}`
    if (isReadOnly) return `View ${config.entityName}`
    return `Edit ${config.entityName}`
  })

  const pageIcon = computed(() => {
    if (isNew) return config.createIcon
    if (isReadOnly) return config.viewIcon
    return config.editIcon
  })

  const banners = computed((): BannerConfig[] => {
    const bannersList: BannerConfig[] = []

    if (isReadOnly) {
      bannersList.push({
        type: 'readonly',
        class: 'bg-orange-1 text-orange-8',
        icon: 'eva-eye-outline',
        message: `You're viewing this ${config.entityName.toLowerCase()} in read-only mode. Contact the owner for edit access.`,
      })
    }

    return bannersList
  })

  return {
    pageTitle,
    pageIcon,
    banners,
  }
}
