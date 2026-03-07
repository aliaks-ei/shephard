import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
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

  it('reacts to state changes when refs are passed', () => {
    const isNew = ref(false)
    const isReadOnly = ref(true)
    const { pageTitle } = useDetailPageState(baseConfig, isNew, isReadOnly)

    expect(pageTitle.value).toBe('View Plan')

    isReadOnly.value = false
    expect(pageTitle.value).toBe('Edit Plan')

    isNew.value = true
    expect(pageTitle.value).toBe('Create Plan')
  })
})
