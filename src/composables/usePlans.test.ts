import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePlans } from './usePlans'
import { setupTestingPinia } from 'test/helpers/pinia-mocks'

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
        id: 'plan-1',
        name: 'Grocery Budget',
        owner_id: 'user-1',
        total: 100,
        start_date: '2024-01-01',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'plan-2',
        name: 'Business Travel',
        owner_id: 'user-2',
        total: 200,
        start_date: '2024-01-02',
        created_at: '2024-01-02T00:00:00Z',
      },
    ],
    userId: 'user-1',
    isLoading: false,
    removePlan: vi.fn(),
  }
  return { usePlansStore: () => store }
})

beforeEach(() => {
  setupTestingPinia()
})

describe('list page wiring for plans', () => {
  it('exposes list state and navigation helpers', () => {
    const lp = usePlans()
    expect(lp.searchQuery.value).toBe('')
    expect(lp.sortBy.value).toBe('created_at')
    expect(lp.filteredAndSortedOwnedItems.value.map((p) => p.id)).toEqual(['plan-1'])
    expect(lp.filteredAndSortedSharedItems.value.map((p) => p.id)).toEqual(['plan-2'])
    lp.goToNew()
    expect(pushMock).toHaveBeenCalledWith({ name: 'new-plan' })
    lp.viewItem('plan-2')
    expect(pushMock).toHaveBeenCalledWith({ name: 'plan-overview', params: { id: 'plan-2' } })
  })

  it('computes empty state config', () => {
    const lp = usePlans()
    const cfg = lp.emptyStateConfig.value
    expect(cfg.emptyTitle).toBe('No plans yet')
    expect(lp.sortOptions.length).toBeGreaterThan(0)
  })
})
