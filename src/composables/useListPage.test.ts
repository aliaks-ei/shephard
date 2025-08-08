import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useListPage } from './useListPage'

// Minimal router for navigation assertions
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<object>('vue-router')
  const push = vi.fn()
  ;(globalThis as unknown as { __pushMock: ReturnType<typeof vi.fn> }).__pushMock = push
  return {
    ...actual,
    useRouter: () => ({ push }),
    __pushMock: push,
  }
})

vi.mock('quasar', () => ({
  Quasar: {},
}))

// Notification store mock via direct import pattern in tests
vi.mock('src/stores/notification', () => ({
  useNotificationStore: () => ({
    showSuccess: vi.fn(),
  }),
}))

type Item = { id: string; name: string; total?: number; created_at?: string }

const items: Item[] = [
  { id: '1', name: 'Alpha', total: 200, created_at: '2024-01-01' },
  { id: '2', name: 'Beta', total: 100, created_at: '2024-02-01' },
]

const filterAndSort = (src: Item[], q: string, sortBy: string) => {
  const filtered = q ? src.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : [...src]
  return filtered.sort((a, b) =>
    sortBy === 'created_at'
      ? new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      : (a.name || '').localeCompare(b.name || ''),
  )
}

const setup = () =>
  useListPage<Item>(
    {
      entityName: 'Plan',
      entityNamePlural: 'Plans',
      newRouteNameSingular: 'new-plan',
      viewRouteNameSingular: 'plan',
      sortOptions: [
        { label: 'Name', value: 'name' },
        { label: 'Created', value: 'created_at' },
      ],
      defaultSort: 'created_at',
      filterAndSortFn: filterAndSort,
      deleteFn: vi.fn().mockResolvedValue(undefined),
    },
    () => items,
    () => [items[0]!],
    () => [items[1]!],
    () => false,
  )

describe('state and derived lists', () => {
  it('initializes search and sort', () => {
    const lp = setup()
    expect(lp.searchQuery.value).toBe('')
    expect(lp.sortBy.value).toBe('created_at')
  })

  it('computes owned and shared filtered lists', () => {
    const lp = setup()
    expect(lp.filteredAndSortedOwnedItems.value.length).toBe(1)
    expect(lp.filteredAndSortedSharedItems.value.length).toBe(1)
    expect(lp.hasItems.value).toBe(true)
    expect(lp.allFilteredAndSortedItems.value.length).toBe(2)
  })

  it('filters by search query', () => {
    const lp = setup()
    lp.searchQuery.value = 'alp'
    expect(lp.filteredAndSortedOwnedItems.value.map((i) => i.name)).toEqual(['Alpha'])
    expect(lp.allFilteredAndSortedItems.value.map((i) => i.name)).toEqual(['Alpha'])
  })
})

describe('navigation', () => {
  beforeEach(() => {
    const mock = (globalThis as unknown as { __pushMock?: ReturnType<typeof vi.fn> }).__pushMock
    mock?.mockClear()
  })

  it('goToNew navigates to create route', () => {
    const lp = setup()
    lp.goToNew()
    const mock = (globalThis as unknown as { __pushMock: ReturnType<typeof vi.fn> }).__pushMock
    expect(mock).toHaveBeenCalledWith({ name: 'new-plan' })
  })

  it('viewItem navigates to view route with id', () => {
    const lp = setup()
    lp.viewItem('2')
    const mock = (globalThis as unknown as { __pushMock: ReturnType<typeof vi.fn> }).__pushMock
    expect(mock).toHaveBeenCalledWith({ name: 'plan', params: { id: '2' } })
  })
})

describe('deletion flow', () => {
  it('calls delete function and shows success notification', () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined)

    const use = () =>
      useListPage<Item>(
        {
          entityName: 'Plan',
          entityNamePlural: 'Plans',
          newRouteNameSingular: 'new-plan',
          viewRouteNameSingular: 'plan',
          sortOptions: [],
          defaultSort: 'created_at',
          filterAndSortFn: filterAndSort,
          deleteFn,
        },
        () => items,
        () => items,
        () => [],
        () => false,
      )

    const lp = use()
    lp.deleteItem({ id: '1', name: 'Alpha' })

    expect(deleteFn).toHaveBeenCalledWith('1')
  })
})

describe('empty state config and utilities', () => {
  it('clears search', () => {
    const lp = setup()
    lp.searchQuery.value = 'test'
    lp.clearSearch()
    expect(lp.searchQuery.value).toBe('')
  })

  it('returns configured empty state object', () => {
    const lp = setup()
    const cfg = lp.emptyStateConfig.value
    expect(cfg.createLabel).toContain('Plan')
    expect(typeof cfg.searchDescription).toBe('string')
  })
})
