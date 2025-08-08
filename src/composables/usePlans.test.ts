import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { usePlans } from './usePlans'

// Router mock for navigation
let pushMock: ReturnType<typeof vi.fn>
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: (pushMock = vi.fn()) }),
}))

// Quasar dialog mock
vi.mock('quasar', () => ({
  useQuasar: () => ({
    dialog: vi.fn(() => ({ onOk: (cb: () => void) => (cb(), { onOk: () => ({}) }) })),
  }),
  Quasar: {},
}))

vi.mock('src/stores/plans', () => {
  const store = {
    plans: [
      {
        id: '1',
        name: 'Alpha',
        owner_id: 'me',
        total: 100,
        start_date: '2024-01-01',
        created_at: '2024-01-05',
      },
      {
        id: '2',
        name: 'Beta',
        owner_id: 'other',
        total: 200,
        start_date: '2024-01-02',
        created_at: '2024-01-06',
      },
    ],
    userId: 'me',
    isLoading: false,
    removePlan: vi.fn(),
  }
  return { usePlansStore: () => store }
})

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
})

describe('list page wiring for plans', () => {
  it('exposes list state and navigation helpers', () => {
    const lp = usePlans()
    expect(lp.searchQuery.value).toBe('')
    expect(lp.sortBy.value).toBe('created_at')
    expect(lp.filteredAndSortedOwnedItems.value.map((p) => p.id)).toEqual(['1'])
    expect(lp.filteredAndSortedSharedItems.value.map((p) => p.id)).toEqual(['2'])
    lp.goToNew()
    expect(pushMock).toHaveBeenCalledWith({ name: 'new-plan' })
    lp.viewItem('2')
    expect(pushMock).toHaveBeenCalledWith({ name: 'plan', params: { id: '2' } })
  })

  it('computes empty state config', () => {
    const lp = usePlans()
    const cfg = lp.emptyStateConfig.value
    expect(cfg.emptyTitle).toBe('No plans yet')
    expect(lp.sortOptions.length).toBeGreaterThan(0)
  })
})
