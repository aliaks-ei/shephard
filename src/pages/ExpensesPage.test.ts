import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExpensesPage from './ExpensesPage.vue'

installQuasarPlugin()

const retry = vi.fn()
const fetchNextPage = vi.fn()
const mockIsPending = ref(false)
const mockIsError = ref(true)
const mockIsFetching = ref(false)
const mockHasNextPage = ref(false)
const mockIsFetchingNextPage = ref(false)
const mockIsOnline = ref(true)
const mockIsOffline = ref(false)
const mockExpenses = ref<
  Array<{
    id: string
    plan_id: string
    category_id: string
    name: string
    amount: number
    expense_date: string
    original_amount: null
    original_currency: null
    categories: { id: string; name: string; color: string; icon: string }
    plans: { id: string; name: string; currency: string }
  }>
>([])

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query')
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  }
})

vi.mock('src/queries/expenses', () => ({
  useRecentExpensesInfiniteQuery: () => ({
    expenses: mockExpenses,
    isPending: mockIsPending,
    isError: mockIsError,
    isFetching: mockIsFetching,
    hasNextPage: mockHasNextPage,
    isFetchingNextPage: mockIsFetchingNextPage,
    fetchNextPage,
    refetch: retry,
  }),
}))

vi.mock('src/composables/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: mockIsOnline,
    isOffline: mockIsOffline,
  }),
}))

vi.mock('src/queries/categories', () => ({
  useCategoriesQuery: () => ({
    categories: ref([]),
  }),
}))

vi.mock('src/queries/plans', () => ({
  usePlansQuery: () => ({
    plansForExpenses: ref([]),
  }),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
  }),
}))

vi.mock('src/stores/preferences', () => ({
  usePreferencesStore: () => ({
    currency: 'USD',
    isPrivacyModeEnabled: false,
  }),
}))

const ExpenseListItemStub = {
  name: 'ExpenseListItem',
  template: '<div data-testid="expense-list-item" />',
  props: [
    'expense',
    'currency',
    'canEdit',
    'showCategory',
    'categoryName',
    'categoryColor',
    'categoryIcon',
    'to',
  ],
}

describe('ExpensesPage', () => {
  beforeEach(() => {
    mockExpenses.value = []
    mockIsPending.value = false
    mockIsError.value = true
    mockIsFetching.value = false
    mockHasNextPage.value = false
    mockIsFetchingNextPage.value = false
    mockIsOnline.value = true
    mockIsOffline.value = false
    retry.mockClear()
    fetchNextPage.mockClear()
  })

  it('shows a retry state instead of the no-expenses state when activity loading fails', () => {
    const wrapper = mount(ExpensesPage, {
      global: {
        stubs: {
          SearchAndSort: true,
          EmptyState: true,
          EmptyExpensesState: {
            template: '<div data-testid="empty-expenses" />',
          },
          ExpenseListItem: ExpenseListItemStub,
          ExpenseRegistrationDialog: true,
          'q-virtual-scroll': {
            template:
              '<div><template v-for="item in items" :key="item.key"><slot :item="item" /></template></div>',
            props: ['items'],
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Could not load activity')
    expect(wrapper.find('[data-testid="empty-expenses"]').exists()).toBe(false)
  })

  it('links activity expense rows to their source plan', () => {
    mockIsError.value = false
    mockExpenses.value = [
      {
        id: 'expense-1',
        plan_id: 'plan-1',
        category_id: 'category-1',
        name: 'Groceries',
        amount: 25,
        expense_date: '2026-07-11',
        original_amount: null,
        original_currency: null,
        categories: {
          id: 'category-1',
          name: 'Food',
          color: '#00897b',
          icon: 'eva-shopping-cart-outline',
        },
        plans: { id: 'plan-1', name: 'Summer', currency: 'USD' },
      },
    ]

    const wrapper = mount(ExpensesPage, {
      global: {
        stubs: {
          SearchAndSort: true,
          EmptyState: true,
          EmptyExpensesState: true,
          ExpenseListItem: ExpenseListItemStub,
          ExpenseRegistrationDialog: true,
          'q-virtual-scroll': {
            template:
              '<div><template v-for="item in items" :key="item.key"><slot :item="item" /></template></div>',
            props: ['items'],
          },
        },
      },
    })

    const expenseItem = wrapper.findComponent({ name: 'ExpenseListItem' })
    expect(expenseItem.props('to')).toEqual({
      name: 'plan',
      params: { id: 'plan-1' },
    })
  })

  it('shows an offline error instead of an indefinite loading skeleton', () => {
    mockIsError.value = false
    mockIsPending.value = true
    mockIsOnline.value = false
    mockIsOffline.value = true

    const wrapper = mount(ExpensesPage, {
      global: {
        stubs: {
          SearchAndSort: true,
          EmptyState: true,
          EmptyExpensesState: true,
          ExpenseListItem: ExpenseListItemStub,
          ExpenseRegistrationDialog: true,
        },
      },
    })

    expect(wrapper.text()).toContain('You are offline')
    expect(wrapper.find('.q-skeleton').exists()).toBe(false)
  })

  it('loads the next bounded activity page from the explicit control', async () => {
    mockIsError.value = false
    mockHasNextPage.value = true
    mockExpenses.value = [
      {
        id: 'expense-1',
        plan_id: 'plan-1',
        category_id: 'category-1',
        name: 'Groceries',
        amount: 25,
        expense_date: '2026-07-11',
        original_amount: null,
        original_currency: null,
        categories: {
          id: 'category-1',
          name: 'Food',
          color: '#00897b',
          icon: 'eva-shopping-cart-outline',
        },
        plans: { id: 'plan-1', name: 'Summer', currency: 'USD' },
      },
    ]

    const wrapper = mount(ExpensesPage, {
      global: {
        stubs: {
          SearchAndSort: true,
          EmptyState: true,
          EmptyExpensesState: true,
          ExpenseListItem: ExpenseListItemStub,
          ExpenseRegistrationDialog: true,
        },
      },
    })

    const loadMoreButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Load more activity'))
    expect(loadMoreButton).toBeDefined()

    await loadMoreButton?.trigger('click')
    expect(fetchNextPage).toHaveBeenCalledOnce()
  })
})
