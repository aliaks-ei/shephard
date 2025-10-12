import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'
import { usePlan } from './usePlan'
import { usePlansStore } from 'src/stores/plans'
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

    const p = usePlan()
    p.currentPlan.value = {
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
    await nextTick()
    expect(p.isOwner.value).toBe(true)
    expect(p.isEditMode.value).toBe(true)
  })

  it('read-only when shared with view permission', () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.userProfile = mockUser('u1')

    const p = usePlan()
    p.currentPlan.value = {
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
    const p = usePlan()
    p.currentPlan.value = {
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
    expect(p.planCurrency.value).toBe('GBP')
  })
})

describe('CRUD flows', () => {
  it('createNewPlanWithItems creates plan and saves items', async () => {
    const plansStore = usePlansStore()
    plansStore.addPlan = vi.fn().mockResolvedValue({ success: true, data: { id: 'np' } })
    plansStore.savePlanItems = vi.fn().mockResolvedValue({ success: true })
    plansStore.loadPlanWithItems = vi.fn().mockResolvedValue({ id: 'np' })

    const { createNewPlanWithItems } = usePlan()
    const result = await createNewPlanWithItems('tpl', 'Name', '2024-01-01', '2024-01-31', 100, [
      { name: 'A', category_id: 'c', amount: 1, is_fixed_payment: true },
    ])

    expect(result.success).toBe(true)
    expect(plansStore.addPlan).toHaveBeenCalledWith({
      template_id: 'tpl',
      name: 'Name',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      total: 100,
    })
    expect(plansStore.savePlanItems).toHaveBeenCalledWith('np', [
      { name: 'A', category_id: 'c', amount: 1, is_fixed_payment: true, plan_id: 'np' },
    ])
  })

  it('createNewPlanWithItems returns false if creation fails', async () => {
    const plansStore = usePlansStore()
    plansStore.addPlan = vi.fn().mockResolvedValue({ success: false })
    const { createNewPlanWithItems } = usePlan()
    const result = await createNewPlanWithItems('tpl', 'Name', 's', 'e', 0, [])
    expect(result.success).toBe(false)
  })

  it('updateExistingPlanWithItems updates, removes old items and saves new ones', async () => {
    mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-123' } }
    const plansStore = usePlansStore()
    const p = usePlan()
    p.currentPlan.value = {
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
    plansStore.editPlan = vi.fn().mockResolvedValue({ success: true, data: { id: 'plan-123' } })
    plansStore.removePlanItems = vi.fn().mockResolvedValue({ success: true })
    plansStore.savePlanItems = vi.fn().mockResolvedValue({ success: true })
    plansStore.loadPlanWithItems = vi.fn().mockResolvedValue({ id: 'plan-123' })

    const result = await p.updateExistingPlanWithItems('N', 's2', 'e2', 2, [
      { name: 'A', category_id: 'c', amount: 2, is_fixed_payment: true },
    ])
    expect(result.success).toBe(true)
    expect(plansStore.editPlan).toHaveBeenCalledWith('plan-123', {
      name: 'N',
      start_date: 's2',
      end_date: 'e2',
      total: 2,
    })
    expect(plansStore.removePlanItems).toHaveBeenCalledWith(['i1'])
    expect(plansStore.savePlanItems).toHaveBeenCalledWith('plan-123', [
      { name: 'A', category_id: 'c', amount: 2, is_fixed_payment: true, plan_id: 'plan-123' },
    ])
  })

  it('updateExistingPlanWithItems returns false when route id missing or no current plan', async () => {
    mockRouteValue.value = { name: 'plan-overview', params: {} }
    let p = usePlan()
    let result = await p.updateExistingPlanWithItems('n', 's', 'e', 0, [])
    expect(result.success).toBe(false)

    mockRouteValue.value = { name: 'plan-overview', params: { id: 'plan-1' } }
    p = usePlan()
    p.currentPlan.value = null
    result = await p.updateExistingPlanWithItems('n', 's', 'e', 0, [])
    expect(result.success).toBe(false)
  })

  it('loadPlan loads plan or returns null for new/missing id', async () => {
    const plansStore = usePlansStore()
    plansStore.loadPlanWithItems = vi.fn().mockResolvedValue({ id: 'plan-123', plan_items: [] })

    const p = usePlan()
    const loaded = await p.loadPlan()
    expect(loaded).toEqual({ id: 'plan-123', plan_items: [] })
    expect(plansStore.loadPlanWithItems).toHaveBeenCalledWith('plan-123')

    mockRouteValue.value = { name: 'new-plan', params: {} }
    const np = usePlan()
    const res = await np.loadPlan()
    expect(res).toBeNull()
  })

  it('cancelCurrentPlan updates store and local status', async () => {
    const plansStore = usePlansStore()
    plansStore.cancelPlan = vi.fn().mockResolvedValue({ success: true })
    const p = usePlan()
    p.currentPlan.value = {
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
    const result = await p.cancelCurrentPlan()
    expect(result.success).toBe(true)
    expect(plansStore.cancelPlan).toHaveBeenCalledWith('plan-123')
    expect(p.currentPlan.value?.status).toBe('cancelled')
  })
})
