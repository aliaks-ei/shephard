import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'
import { usePlan } from './usePlan'
import { useUserStore } from 'src/stores/user'

const mockRouteValue = ref<{ name: string; params: Record<string, string | string[] | undefined> }>(
  {
    name: 'plan-overview',
    params: { id: 'plan-123' },
  },
)

const mockRoute = {
  get name() {
    return mockRouteValue.value.name
  },
  get params() {
    return mockRouteValue.value.params
  },
}

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

vi.mock('src/utils/plans', () => ({
  canEditPlan: vi.fn((plan: unknown) => Boolean(plan)),
}))

const {
  mockCreatePlanMutation,
  mockUpdatePlanMutation,
  mockDeletePlanMutation,
  mockSavePlanItemsMutation,
  mockUpdatePlanItemsMutation,
  mockDeletePlanItemsMutation,
  mockPlanDetailQuery,
} = vi.hoisted(() => ({
  mockCreatePlanMutation: { mutateAsync: vi.fn() },
  mockUpdatePlanMutation: { mutateAsync: vi.fn() },
  mockDeletePlanMutation: { mutateAsync: vi.fn() },
  mockSavePlanItemsMutation: { mutateAsync: vi.fn() },
  mockUpdatePlanItemsMutation: { mutateAsync: vi.fn() },
  mockDeletePlanItemsMutation: { mutateAsync: vi.fn() },
  mockPlanDetailQuery: { data: { value: null }, refetch: vi.fn(), isPending: { value: false } } as {
    data: { value: unknown }
    refetch: ReturnType<typeof vi.fn>
    isPending: { value: boolean }
  },
}))

vi.mock('src/queries/plans', () => ({
  usePlanDetailQuery: () => mockPlanDetailQuery,
  useCreatePlanMutation: () => mockCreatePlanMutation,
  useUpdatePlanMutation: () => mockUpdatePlanMutation,
  useDeletePlanMutation: () => mockDeletePlanMutation,
  useSavePlanItemsMutation: () => mockSavePlanItemsMutation,
  useUpdatePlanItemsMutation: () => mockUpdatePlanItemsMutation,
  useDeletePlanItemsMutation: () => mockDeletePlanItemsMutation,
}))

let pinia: TestingPinia

const mockUser = (id: string) => ({
  id,
  email: `user-${id}@example.com`,
  displayName: `User ${id}`,
  avatarUrl: undefined,
  nameInitial: 'U',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  isEmailVerified: true,
  authProvider: 'email' as const,
  formattedCreatedAt: 'Jan 1, 2024',
  preferences: { darkMode: false, pushNotificationsEnabled: true, currency: 'USD' },
})

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-123' } }

  mockCreatePlanMutation.mutateAsync.mockReset()
  mockUpdatePlanMutation.mutateAsync.mockReset()
  mockDeletePlanMutation.mutateAsync.mockReset()
  mockSavePlanItemsMutation.mutateAsync.mockReset()
  mockUpdatePlanItemsMutation.mutateAsync.mockReset()
  mockDeletePlanItemsMutation.mutateAsync.mockReset()
  mockPlanDetailQuery.refetch.mockReset()
  mockPlanDetailQuery.data = ref(null)
  mockPlanDetailQuery.isPending = ref(false)
})

describe('computed state', () => {
  it('detects new plan and extracts route id', () => {
    mockRouteValue.value = { name: 'new-plan', params: {} }
    const p = usePlan()
    expect(p.isNewPlan.value).toBe(true)
    expect(p.routePlanId.value).toBeNull()
  })

  it('owner and modes based on user and permission', async () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.userProfile = mockUser('u1')

    mockPlanDetailQuery.data.value = {
      id: 'plan-123',
      owner_id: 'u1',
      template_id: 'tpl-123',
      name: 'My Plan',
      start_date: '2024-01-01',
      end_date: '2024-02-01',
      total: 0,
      currency: 'USD',
      created_at: '2024-01-01',
      status: 'pending',
      updated_at: '2024-01-01',
      plan_items: [],
    }

    const p = usePlan()
    await nextTick()
    expect(p.isOwner.value).toBe(true)
    expect(p.isEditMode.value).toBe(true)
  })

  it('read-only when shared with view permission', () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.userProfile = mockUser('u1')

    mockPlanDetailQuery.data.value = {
      id: 'plan-2',
      owner_id: 'u2',
      template_id: 'tpl-2',
      name: 'Shared',
      start_date: '2024-01-01',
      end_date: '2024-02-01',
      total: 0,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      status: 'pending',
      plan_items: [],
      permission_level: 'view',
    }

    const p = usePlan()
    expect(p.isEditMode.value).toBe(false)
  })

  it('planCurrency uses preferences for new plan and plan currency otherwise', () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.preferences = { currency: 'EUR' }

    mockRouteValue.value = { name: 'new-plan', params: {} }
    const pNew = usePlan()
    expect(pNew.planCurrency.value).toBe('EUR')

    mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-1' } }
    mockPlanDetailQuery.data.value = {
      id: 'plan-1',
      owner_id: 'x',
      template_id: 'tpl-1',
      name: 'X',
      start_date: '2024',
      end_date: '2024',
      total: 0,
      currency: 'GBP',
      created_at: '2024',
      updated_at: '2024',
      status: 'pending',
      plan_items: [],
    }
    const p = usePlan()
    expect(p.planCurrency.value).toBe('GBP')
  })
})

describe('CRUD flows', () => {
  it('createNewPlanWithItems creates plan and saves items', async () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.userProfile = mockUser('u1')
    // @ts-expect-error - test state
    userStore.preferences = { currency: 'USD' }

    const createdPlan = { id: 'np' }
    mockCreatePlanMutation.mutateAsync.mockResolvedValue(createdPlan)
    mockSavePlanItemsMutation.mutateAsync.mockResolvedValue([])
    mockPlanDetailQuery.refetch.mockResolvedValue({
      data: { id: 'np', plan_items: [{ name: 'A' }] },
    })

    const { createNewPlanWithItems } = usePlan()
    const result = await createNewPlanWithItems('tpl', 'Name', '2024-01-01', '2024-01-31', 100, [
      { name: 'A', category_id: 'c', amount: 1, is_fixed_payment: true },
    ])

    expect(result.success).toBe(true)
    expect(mockCreatePlanMutation.mutateAsync).toHaveBeenCalledWith({
      template_id: 'tpl',
      name: 'Name',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      total: 100,
      owner_id: 'u1',
      currency: 'USD',
      status: 'active',
    })
    expect(mockSavePlanItemsMutation.mutateAsync).toHaveBeenCalledWith({
      planId: 'np',
      items: [{ name: 'A', category_id: 'c', amount: 1, is_fixed_payment: true, plan_id: 'np' }],
    })
  })

  it('createNewPlanWithItems returns false if creation fails', async () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.userProfile = mockUser('u1')
    // @ts-expect-error - test state
    userStore.preferences = { currency: 'USD' }

    mockCreatePlanMutation.mutateAsync.mockRejectedValue(new Error('fail'))

    const { createNewPlanWithItems } = usePlan()
    const result = await createNewPlanWithItems('tpl', 'Name', 's', 'e', 0, [])
    expect(result.success).toBe(false)
  })

  it('updateExistingPlanWithItems updates, removes old items and saves new ones', async () => {
    mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-123' } }

    mockPlanDetailQuery.data.value = {
      id: 'plan-123',
      owner_id: 'u',
      template_id: 'tpl-123',
      name: 'Old',
      start_date: 's',
      end_date: 'e',
      total: 0,
      currency: 'USD',
      created_at: 'c',
      updated_at: 'u',
      status: 'pending',
      plan_items: [
        {
          id: 'i1',
          plan_id: 'plan-123',
          name: 'X',
          category_id: 'c',
          amount: 1,
          created_at: 'c',
          updated_at: 'u',
          is_completed: false,
          is_fixed_payment: true,
        },
      ],
    }

    const p = usePlan()

    const updatedPlan = { id: 'plan-123' }
    mockUpdatePlanMutation.mutateAsync.mockResolvedValue(updatedPlan)
    mockDeletePlanItemsMutation.mutateAsync.mockResolvedValue(undefined)
    mockSavePlanItemsMutation.mutateAsync.mockResolvedValue([])
    mockPlanDetailQuery.refetch.mockResolvedValue({
      data: { id: 'plan-123', plan_items: [{ name: 'A' }] },
    })

    const result = await p.updateExistingPlanWithItems('N', 's2', 'e2', 2, [
      { name: 'A', category_id: 'c', amount: 2, is_fixed_payment: true },
    ])
    expect(result.success).toBe(true)
    expect(mockUpdatePlanMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'plan-123',
      updates: {
        name: 'N',
        start_date: 's2',
        end_date: 'e2',
        total: 2,
      },
    })
    expect(mockDeletePlanItemsMutation.mutateAsync).toHaveBeenCalledWith({
      planId: 'plan-123',
      itemIds: ['i1'],
    })
    expect(mockSavePlanItemsMutation.mutateAsync).toHaveBeenCalledWith({
      planId: 'plan-123',
      items: [
        { name: 'A', category_id: 'c', amount: 2, is_fixed_payment: true, plan_id: 'plan-123' },
      ],
    })
  })

  it('updateExistingPlanWithItems returns false when route id missing or no current plan', async () => {
    mockRouteValue.value = { name: 'plan-overview', params: {} }
    let p = usePlan()
    let result = await p.updateExistingPlanWithItems('n', 's', 'e', 0, [])
    expect(result.success).toBe(false)

    mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-1' } }
    mockPlanDetailQuery.data.value = null
    p = usePlan()
    result = await p.updateExistingPlanWithItems('n', 's', 'e', 0, [])
    expect(result.success).toBe(false)
  })

  it('loadPlan loads plan or returns null for new/missing id', async () => {
    mockPlanDetailQuery.refetch.mockResolvedValue({
      data: { id: 'plan-123', plan_items: [] },
    })

    const p = usePlan()
    const loaded = await p.loadPlan()
    expect(loaded).toEqual({ id: 'plan-123', plan_items: [] })
    expect(mockPlanDetailQuery.refetch).toHaveBeenCalled()

    mockRouteValue.value = { name: 'new-plan', params: {} }
    const np = usePlan()
    const res = await np.loadPlan()
    expect(res).toBeNull()
  })

  it('cancelCurrentPlan calls update mutation with cancelled status', async () => {
    mockUpdatePlanMutation.mutateAsync.mockResolvedValue({ id: 'plan-123' })

    mockPlanDetailQuery.data.value = {
      id: 'plan-123',
      owner_id: 'u',
      template_id: 'tpl-123',
      name: 'P',
      start_date: 's',
      end_date: 'e',
      total: 0,
      currency: 'USD',
      created_at: 'c',
      updated_at: 'u',
      status: 'pending',
      plan_items: [],
    }

    const p = usePlan()
    const result = await p.cancelCurrentPlan()
    expect(result.success).toBe(true)
    expect(mockUpdatePlanMutation.mutateAsync).toHaveBeenCalledWith({
      id: 'plan-123',
      updates: { status: 'cancelled' },
    })
  })
})
