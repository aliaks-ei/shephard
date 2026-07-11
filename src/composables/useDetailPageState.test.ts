import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
  resolveDetailLoadState,
  useDetailPageState,
  type DetailPageConfig,
} from './useDetailPageState'
import { EntityLoadError } from 'src/api'

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

describe('detail load state', () => {
  it('returns ready for create pages without an entity', () => {
    expect(
      resolveDetailLoadState({
        isNew: true,
        isPending: false,
        data: null,
        isError: false,
        error: null,
      }),
    ).toEqual({ status: 'ready', data: null })
  })

  it.each([
    ['not-found', 'not-found'],
    ['access-denied', 'denied'],
  ] as const)('maps %s entity errors to %s', (kind, status) => {
    const error = new EntityLoadError(kind, 'plan', 'plan-1', 'Failed')

    expect(
      resolveDetailLoadState({
        isNew: false,
        isPending: false,
        data: null,
        isError: true,
        error,
      }),
    ).toEqual({ status })
  })

  it('keeps unknown failures as retryable errors', () => {
    const error = new Error('Network failed')

    expect(
      resolveDetailLoadState({
        isNew: false,
        isPending: false,
        data: null,
        isError: true,
        error,
      }),
    ).toEqual({ status: 'error', error })
  })

  it('exposes an error state instead of indefinite loading while offline', () => {
    const state = resolveDetailLoadState({
      isNew: false,
      isPending: true,
      data: null,
      isError: false,
      error: null,
      isOnline: false,
    })

    expect(state.status).toBe('error')
  })
})
