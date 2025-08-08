import { describe, it, expect } from 'vitest'
import { useDetailPageState, type DetailPageConfig } from './useDetailPageState'

const baseConfig: DetailPageConfig = {
  entityName: 'Plan',
  entityNamePlural: 'Plans',
  listRoute: '/plans',
  listIcon: 'eva-calendar-outline',
  createIcon: 'eva-plus-outline',
  editIcon: 'eva-edit-2-outline',
  viewIcon: 'eva-eye-outline',
}

describe('titles and icons', () => {
  it('returns Create title and create icon for new entity', () => {
    const { pageTitle, pageIcon } = useDetailPageState(baseConfig, true, false, true)
    expect(pageTitle.value).toBe('Create Plan')
    expect(pageIcon.value).toBe('eva-plus-outline')
  })

  it('returns View title and view icon for read-only state', () => {
    const { pageTitle, pageIcon } = useDetailPageState(baseConfig, false, true, false)
    expect(pageTitle.value).toBe('View Plan')
    expect(pageIcon.value).toBe('eva-eye-outline')
  })

  it('returns Edit title and edit icon by default', () => {
    const { pageTitle, pageIcon } = useDetailPageState(baseConfig, false, false, true)
    expect(pageTitle.value).toBe('Edit Plan')
    expect(pageIcon.value).toBe('eva-edit-2-outline')
  })
})

describe('breadcrumbs', () => {
  it('includes list breadcrumb and new label for new entity', () => {
    const { breadcrumbs } = useDetailPageState(baseConfig, true, false, true)
    expect(breadcrumbs.value[0]).toEqual({
      label: 'Plans',
      icon: 'eva-calendar-outline',
      to: '/plans',
    })
    expect(breadcrumbs.value[1]).toMatchObject({ label: 'New Plan' })
  })

  it('uses current entity name when provided', () => {
    const { breadcrumbs } = useDetailPageState(baseConfig, false, false, true, 'Q1 Budget')
    expect(breadcrumbs.value[1]).toMatchObject({ label: 'Q1 Budget', icon: 'eva-calendar-outline' })
  })
})

describe('banners', () => {
  it('shows readonly banner when isReadOnly is true', () => {
    const { banners } = useDetailPageState(baseConfig, false, true, false)
    expect(banners.value.length).toBe(1)
    expect(banners.value[0]).toMatchObject({
      type: 'readonly',
      icon: 'eva-eye-outline',
    })
    const msg = banners.value[0]?.message
    expect(msg).toBeDefined()
    if (msg) {
      expect(msg).toContain('read-only mode')
    }
  })

  it('returns empty banners when not read-only', () => {
    const { banners } = useDetailPageState(baseConfig, true, false, true)
    expect(banners.value.length).toBe(0)
  })
})
