import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { ref, nextTick } from 'vue'
import { usePlan } from './usePlan'
import { usePlansStore } from 'src/stores/plans'
import { useUserStore } from 'src/stores/user'

const mockRoute = ref<{ name: string; params: Record<string, string | string[] | undefined> }>({
  name: 'plan',
  params: { id: 'plan-123' },
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
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
  mockRoute.value = { name: 'plan', params: { id: 'plan-123' } }
})

describe('computed state', () => {
  it('detects new plan and extracts route id', () => {
    mockRoute.value = { name: 'new-plan', params: {} }
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
      status: 'active',
      total: 0,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      plan_items: [],
    }
    await nextTick()
    expect(p.isOwner.value).toBe(true)
    expect(p.isEditMode.value).toBe(true)
    expect(p.isReadOnlyMode.value).toBe(false)
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
      status: 'active',
      total: 0,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      plan_items: [],
      permission_level: 'view',
    }
    expect(p.isReadOnlyMode.value).toBe(true)
    expect(p.isEditMode.value).toBe(false)
  })

  it('planCurrency uses preferences for new plan and plan currency otherwise', () => {
    const userStore = useUserStore()
    // @ts-expect-error - test state
    userStore.preferences = { currency: 'EUR' }

    mockRoute.value = { name: 'new-plan', params: {} }
    const pNew = usePlan()
    expect(pNew.planCurrency.value).toBe('EUR')

    mockRoute.value = { name: 'plan', params: { id: 'plan-1' } }
    const p = usePlan()
    p.currentPlan.value = {
      id: 'plan-1',
      owner_id: 'x',
      template_id: 'tpl-1',
      name: 'X',
      start_date: '2024',
      end_date: '2024',
      status: 'active',
      total: 0,
      currency: 'GBP',
      created_at: '2024',
      updated_at: '2024',
      plan_items: [],
    }
    expect(p.planCurrency.value).toBe('GBP')
  })
})

describe('CRUD flows', () => {
  it('createNewPlanWithItems creates plan and saves items', async () => {
    const plansStore = usePlansStore()
    plansStore.addPlan = vi.fn().mockResolvedValue({ id: 'np' })
    plansStore.savePlanItems = vi.fn().mockResolvedValue([])

    const { createNewPlanWithItems } = usePlan()
    const ok = await createNewPlanWithItems(
      'tpl',
      'Name',
      '2024-01-01',
      '2024-01-31',
      'active',
      100,
      [{ name: 'A', category_id: 'c', amount: 1 }],
    )

    expect(ok).toBe(true)
    expect(plansStore.addPlan).toHaveBeenCalledWith({
      template_id: 'tpl',
      name: 'Name',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'active',
      total: 100,
    })
    expect(plansStore.savePlanItems).toHaveBeenCalledWith('np', [
      { name: 'A', category_id: 'c', amount: 1, plan_id: 'np' },
    ])
  })

  it('createNewPlanWithItems returns false if creation fails', async () => {
    const plansStore = usePlansStore()
    plansStore.addPlan = vi.fn().mockResolvedValue(null)
    const { createNewPlanWithItems } = usePlan()
    const ok = await createNewPlanWithItems('tpl', 'Name', 's', 'e', 'active', 0, [])
    expect(ok).toBe(false)
  })

  it('updateExistingPlanWithItems updates, removes old items and saves new ones', async () => {
    mockRoute.value = { name: 'plan', params: { id: 'plan-123' } }
    const plansStore = usePlansStore()
    const p = usePlan()
    p.currentPlan.value = {
      id: 'plan-123',
      owner_id: 'u',
      template_id: 'tpl-123',
      name: 'Old',
      start_date: 's',
      end_date: 'e',
      status: 'active',
      total: 0,
      currency: 'USD',
      created_at: 'c',
      updated_at: 'u',
      plan_items: [
        {
          id: 'i1',
          plan_id: 'plan-123',
          name: 'X',
          category_id: 'c',
          amount: 1,
          created_at: 'c',
          updated_at: 'u',
        },
      ],
    }
    plansStore.editPlan = vi.fn().mockResolvedValue({ id: 'plan-123' })
    plansStore.removePlanItems = vi.fn().mockResolvedValue(undefined)
    plansStore.savePlanItems = vi.fn().mockResolvedValue([])

    const ok = await p.updateExistingPlanWithItems('N', 's2', 'e2', 'active', 2, [
      { name: 'A', category_id: 'c', amount: 2 },
    ])
    expect(ok).toBe(true)
    expect(plansStore.editPlan).toHaveBeenCalledWith('plan-123', {
      name: 'N',
      start_date: 's2',
      end_date: 'e2',
      status: 'active',
      total: 2,
    })
    expect(plansStore.removePlanItems).toHaveBeenCalledWith(['i1'])
    expect(plansStore.savePlanItems).toHaveBeenCalledWith('plan-123', [
      { name: 'A', category_id: 'c', amount: 2, plan_id: 'plan-123' },
    ])
  })

  it('updateExistingPlanWithItems returns false when route id missing or no current plan', async () => {
    mockRoute.value = { name: 'plan', params: {} }
    let p = usePlan()
    let ok = await p.updateExistingPlanWithItems('n', 's', 'e', 'active', 0, [])
    expect(ok).toBe(false)

    mockRoute.value = { name: 'plan', params: { id: 'plan-1' } }
    p = usePlan()
    p.currentPlan.value = null
    ok = await p.updateExistingPlanWithItems('n', 's', 'e', 'active', 0, [])
    expect(ok).toBe(false)
  })

  it('loadPlan loads plan or returns null for new/missing id', async () => {
    const plansStore = usePlansStore()
    plansStore.loadPlanWithItems = vi.fn().mockResolvedValue({ id: 'plan-123', plan_items: [] })

    const p = usePlan()
    const loaded = await p.loadPlan()
    expect(loaded).toEqual({ id: 'plan-123', plan_items: [] })
    expect(plansStore.loadPlanWithItems).toHaveBeenCalledWith('plan-123')

    mockRoute.value = { name: 'new-plan', params: {} }
    const np = usePlan()
    const res = await np.loadPlan()
    expect(res).toBeNull()
  })

  it('cancelCurrentPlan updates store and local status', async () => {
    const plansStore = usePlansStore()
    plansStore.cancelPlan = vi.fn().mockResolvedValue(undefined)
    const p = usePlan()
    p.currentPlan.value = {
      id: 'plan-123',
      owner_id: 'u',
      template_id: 'tpl-123',
      name: 'P',
      start_date: 's',
      end_date: 'e',
      status: 'active',
      total: 0,
      currency: 'USD',
      created_at: 'c',
      updated_at: 'u',
      plan_items: [],
    }
    await p.cancelCurrentPlan()
    expect(plansStore.cancelPlan).toHaveBeenCalledWith('plan-123')
    expect(p.currentPlan.value?.status).toBe('cancelled')
  })
})
