import { describe, it, expect } from 'vitest'
import { useDetailPageState, type DetailPageConfig } from './useDetailPageState'

const baseConfig: DetailPageConfig = {
  entityName: 'Plan',
  entityNamePlural: 'Plans',
  listRoute: '/plans',
  listIcon: 'eva-calendar-outline',
}

describe('titles', () => {
  it('returns Create title for new entity', () => {
    const { pageTitle } = useDetailPageState(baseConfig, true, false)
    expect(pageTitle.value).toBe('Create Plan')
  })

  it('returns View title for read-only state', () => {
    const { pageTitle } = useDetailPageState(baseConfig, false, true)
    expect(pageTitle.value).toBe('View Plan')
  })

  it('returns Edit title by default', () => {
    const { pageTitle } = useDetailPageState(baseConfig, false, false)
    expect(pageTitle.value).toBe('Edit Plan')
  })
})

describe('banners', () => {
  it('shows readonly banner when isReadOnly is true', () => {
    const { banners } = useDetailPageState(baseConfig, false, true)
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
    const { banners } = useDetailPageState(baseConfig, true, false)
    expect(banners.value.length).toBe(0)
  })
})
