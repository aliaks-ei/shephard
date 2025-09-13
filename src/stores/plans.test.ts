import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'

import { usePlansStore } from './plans'
import { useUserStore } from './user'
import { useError } from 'src/composables/useError'
import * as plansApi from 'src/api/plans'
import * as userApi from 'src/api/user'
import type {
  Plan,
  PlanWithPermission,
  PlanInsert,
  PlanUpdate,
  PlanItemInsert,
  PlanSharedUser,
} from 'src/api/plans'
import type { UserSearchResult } from 'src/api/user'
import {
  createMockPlans,
  createMockPlanWithItems,
  createMockPlanSharedUsers,
} from 'test/fixtures/plans'
import { createMockUserStoreData, createMockUserSearchResults } from 'test/fixtures/users'

vi.mock('src/composables/useError', () => ({
  useError: vi.fn(),
}))

vi.mock('src/api/plans', () => ({
  getPlans: vi.fn(),
  getPlanWithItems: vi.fn(),
  getPlanSharedUsers: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  sharePlan: vi.fn(),
  unsharePlan: vi.fn(),
  updatePlanSharePermission: vi.fn(),
  createPlanItems: vi.fn(),
  deletePlanItems: vi.fn(),
}))

vi.mock('src/api/user', () => ({
  searchUsersByEmail: vi.fn(),
}))

vi.mock('./user', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('./auth', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('./preferences', () => ({
  usePreferencesStore: vi.fn(),
}))

describe('Plans Store', () => {
  // Using our mock data factories instead of inline objects - much cleaner!
  const mockHandleError = vi.fn()
  const mockUserStoreData = createMockUserStoreData()
  const mockPlans = createMockPlans(2)
  const mockPlanWithItems = createMockPlanWithItems(1)
  const mockSharedUsers = createMockPlanSharedUsers(1)
  const mockUserSearchResults = createMockUserSearchResults(1)

  let plansStore: ReturnType<typeof usePlansStore>

  const mockPlanItems: PlanItemInsert[] = [
    {
      plan_id: mockPlans[0]!.id,
      name: 'Bread',
      category_id: 'cat-1',
      amount: 3.5,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup error handling mock
    vi.mocked(useError).mockReturnValue({
      handleError: mockHandleError,
    })

    // Mock user store with our factory data
    vi.mocked(useUserStore).mockReturnValue(
      mockUserStoreData as unknown as ReturnType<typeof useUserStore>,
    )

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
    })
    plansStore = usePlansStore()
  })

  describe('State Management', () => {
    it('should initialize with empty state', () => {
      expect(plansStore.plans).toEqual([])
      expect(plansStore.sharedUsers).toEqual([])
      expect(plansStore.userSearchResults).toEqual([])
      expect(plansStore.isLoading).toBe(false)
      expect(plansStore.isSharing).toBe(false)
      expect(plansStore.isSearchingUsers).toBe(false)
    })

    it('should calculate userId correctly', () => {
      expect(plansStore.userId).toBe('user-123')
    })

    it('should filter ownedPlans correctly', () => {
      plansStore.plans = mockPlans
      expect(plansStore.ownedPlans).toHaveLength(1)
      expect(plansStore.ownedPlans[0]?.id).toBe('plan-1')
    })

    it('should filter sharedPlans correctly', () => {
      plansStore.plans = mockPlans
      expect(plansStore.sharedPlans).toHaveLength(1)
      expect(plansStore.sharedPlans[0]?.id).toBe('plan-2')
    })
  })

  describe('loadPlans', () => {
    it('should load plans successfully', async () => {
      vi.mocked(plansApi.getPlans).mockResolvedValue(mockPlans)

      await plansStore.loadPlans()

      expect(plansApi.getPlans).toHaveBeenCalledWith('user-123')
      expect(plansStore.plans).toEqual(mockPlans)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when loading plans', async () => {
      const error = new Error('Failed to load')
      vi.mocked(plansApi.getPlans).mockRejectedValue(error)

      await plansStore.loadPlans()

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.LOAD_FAILED', error)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not load plans if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.loadPlans()

      expect(plansApi.getPlans).not.toHaveBeenCalled()
    })

    it('should set loading state correctly', async () => {
      vi.mocked(plansApi.getPlans).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(plansStore.isLoading).toBe(true)
            resolve(mockPlans)
          }),
      )

      await plansStore.loadPlans()

      expect(plansStore.isLoading).toBe(false)
    })
  })

  describe('loadPlanWithItems', () => {
    it('should load plan with items successfully', async () => {
      vi.mocked(plansApi.getPlanWithItems).mockResolvedValue(mockPlanWithItems)

      const result = await plansStore.loadPlanWithItems('plan-1')

      expect(plansApi.getPlanWithItems).toHaveBeenCalledWith('plan-1', 'user-123')
      expect(result).toEqual(mockPlanWithItems)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when loading plan with items', async () => {
      const error = new Error('Failed to load plan')
      vi.mocked(plansApi.getPlanWithItems).mockRejectedValue(error)

      const result = await plansStore.loadPlanWithItems('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.LOAD_PLAN_FAILED', error, {
        planId: 'plan-1',
      })
      expect(result).toBeNull()
      expect(plansStore.isLoading).toBe(false)
    })

    it('should return null if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      const result = await plansStore.loadPlanWithItems('plan-1')

      expect(plansApi.getPlanWithItems).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })

  describe('addPlan', () => {
    const planData: Omit<PlanInsert, 'owner_id' | 'currency'> = {
      name: 'New Plan',
      start_date: '2023-01-01',
      end_date: '2023-01-08',
      template_id: 'template-1',
    }

    it('should create plan successfully', async () => {
      const newPlan = { ...mockPlans[0], id: 'new-plan' } as Plan
      vi.mocked(plansApi.createPlan).mockResolvedValue(newPlan)

      const result = await plansStore.addPlan(planData)

      expect(plansApi.createPlan).toHaveBeenCalledWith({
        ...planData,
        owner_id: 'user-123',
        currency: 'USD',
      })
      expect(result).toEqual(newPlan)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle duplicate name errors', async () => {
      const error = new Error('Duplicate name')
      error.name = 'DUPLICATE_PLAN_NAME'
      vi.mocked(plansApi.createPlan).mockRejectedValue(error)

      await plansStore.addPlan(planData)

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.DUPLICATE_NAME', error)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(plansApi.createPlan).mockRejectedValue(error)

      await plansStore.addPlan(planData)

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.CREATE_FAILED', error)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not create plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.addPlan(planData)

      expect(plansApi.createPlan).not.toHaveBeenCalled()
    })
  })

  describe('editPlan', () => {
    const updates: PlanUpdate = {
      name: 'Updated Plan',
      end_date: '2023-01-15',
    }

    beforeEach(() => {
      plansStore.plans = [...mockPlans]
    })

    it('should update plan successfully', async () => {
      const updatedPlan = { ...mockPlans[0], ...updates } as Plan
      vi.mocked(plansApi.updatePlan).mockResolvedValue(updatedPlan)

      const result = await plansStore.editPlan('plan-1', updates)

      expect(plansApi.updatePlan).toHaveBeenCalledWith('plan-1', updates)
      expect(result).toEqual(updatedPlan)
      expect(plansStore.plans[0]?.name).toBe('Updated Plan')
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle duplicate name errors', async () => {
      const error = new Error('Duplicate name')
      error.name = 'DUPLICATE_PLAN_NAME'
      vi.mocked(plansApi.updatePlan).mockRejectedValue(error)

      await plansStore.editPlan('plan-1', updates)

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.DUPLICATE_NAME', error)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(plansApi.updatePlan).mockRejectedValue(error)

      await plansStore.editPlan('plan-1', updates)

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.UPDATE_FAILED', error, {
        planId: 'plan-1',
      })
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not update plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.editPlan('plan-1', updates)

      expect(plansApi.updatePlan).not.toHaveBeenCalled()
    })
  })

  describe('removePlan', () => {
    beforeEach(() => {
      plansStore.plans = [...mockPlans]
    })

    it('should delete plan successfully', async () => {
      vi.mocked(plansApi.deletePlan).mockResolvedValue()

      await plansStore.removePlan('plan-1')

      expect(plansApi.deletePlan).toHaveBeenCalledWith('plan-1')
      expect(plansStore.plans).toHaveLength(1)
      expect(plansStore.plans.find((p) => p.id === 'plan-1')).toBeUndefined()
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when deleting plan', async () => {
      const error = new Error('Failed to delete')
      vi.mocked(plansApi.deletePlan).mockRejectedValue(error)

      await plansStore.removePlan('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.DELETE_FAILED', error, {
        planId: 'plan-1',
      })
      expect(plansStore.plans).toHaveLength(2)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not delete plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.removePlan('plan-1')

      expect(plansApi.deletePlan).not.toHaveBeenCalled()
    })
  })

  describe('cancelPlan', () => {
    beforeEach(() => {
      plansStore.plans = [...mockPlans]
    })

    it('should cancel plan successfully', async () => {
      const updatedPlan = { ...mockPlans[0], status: 'cancelled' } as Plan
      vi.mocked(plansApi.updatePlan).mockResolvedValue(updatedPlan)

      await plansStore.cancelPlan('plan-1')

      expect(plansApi.updatePlan).toHaveBeenCalledWith('plan-1', { status: 'cancelled' })
    })

    it('should not cancel plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.cancelPlan('plan-1')

      expect(plansApi.updatePlan).not.toHaveBeenCalled()
    })
  })

  describe('loadSharedUsers', () => {
    it('should load shared users successfully', async () => {
      vi.mocked(plansApi.getPlanSharedUsers).mockResolvedValue(mockSharedUsers)

      const result = await plansStore.loadSharedUsers('plan-1')

      expect(plansApi.getPlanSharedUsers).toHaveBeenCalledWith('plan-1')
      expect(plansStore.sharedUsers).toEqual(mockSharedUsers)
      expect(result).toEqual(mockSharedUsers)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when loading shared users', async () => {
      const error = new Error('Failed to load shared users')
      vi.mocked(plansApi.getPlanSharedUsers).mockRejectedValue(error)

      const result = await plansStore.loadSharedUsers('plan-1')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.LOAD_SHARED_USERS_FAILED', error, {
        planId: 'plan-1',
      })
      expect(result).toEqual([])
      expect(plansStore.isLoading).toBe(false)
    })

    it('should set loading state correctly', async () => {
      vi.mocked(plansApi.getPlanSharedUsers).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(plansStore.isLoading).toBe(true)
            resolve(mockSharedUsers)
          }),
      )

      await plansStore.loadSharedUsers('plan-1')

      expect(plansStore.isLoading).toBe(false)
    })
  })

  describe('sharePlanWithUser', () => {
    beforeEach(() => {
      plansStore.plans = [...mockPlans]
      vi.mocked(plansApi.sharePlan).mockResolvedValue()
      vi.mocked(plansApi.getPlanSharedUsers).mockResolvedValue(mockSharedUsers)
    })

    it('should share plan successfully', async () => {
      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(plansApi.sharePlan).toHaveBeenCalledWith(
        'plan-1',
        'user@example.com',
        'edit',
        'user-123',
      )
      expect(plansStore.plans[0]?.is_shared).toBe(true)
      expect(plansApi.getPlanSharedUsers).toHaveBeenCalledWith('plan-1')
      expect(plansStore.isSharing).toBe(false)
    })

    it('should handle user not found errors', async () => {
      const error = new Error('User not found')
      vi.mocked(plansApi.sharePlan).mockRejectedValue(error)

      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.USER_NOT_FOUND', error, {
        userEmail: 'user@example.com',
      })
      expect(plansStore.isSharing).toBe(false)
    })

    it('should handle already shared errors', async () => {
      const error = new Error('Plan already shared with user')
      vi.mocked(plansApi.sharePlan).mockRejectedValue(error)

      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.ALREADY_SHARED', error, {
        userEmail: 'user@example.com',
      })
      expect(plansStore.isSharing).toBe(false)
    })

    it('should handle general errors', async () => {
      const error = new Error('General error')
      vi.mocked(plansApi.sharePlan).mockRejectedValue(error)

      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.SHARE_FAILED', error, {
        planId: 'plan-1',
        userEmail: 'user@example.com',
      })
      expect(plansStore.isSharing).toBe(false)
    })

    it('should not share plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(plansApi.sharePlan).not.toHaveBeenCalled()
    })

    it('should set sharing state correctly', async () => {
      vi.mocked(plansApi.sharePlan).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(plansStore.isSharing).toBe(true)
            resolve()
          }),
      )

      await plansStore.sharePlanWithUser('plan-1', 'user@example.com', 'edit')

      expect(plansStore.isSharing).toBe(false)
    })
  })

  describe('unsharePlanWithUser', () => {
    beforeEach(() => {
      plansStore.plans = [...mockPlans]
      plansStore.sharedUsers = [...mockSharedUsers]
      vi.mocked(plansApi.unsharePlan).mockResolvedValue()
    })

    it('should unshare plan successfully', async () => {
      await plansStore.unsharePlanWithUser('plan-1', 'user-456')

      expect(plansApi.unsharePlan).toHaveBeenCalledWith('plan-1', 'user-456')
      expect(plansStore.sharedUsers).toHaveLength(0)
      expect(plansStore.plans[0]?.is_shared).toBe(false)
      expect(plansStore.isSharing).toBe(false)
    })

    it('should handle errors when unsharing plan', async () => {
      const error = new Error('Failed to unshare')
      vi.mocked(plansApi.unsharePlan).mockRejectedValue(error)

      await plansStore.unsharePlanWithUser('plan-1', 'user-456')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.UNSHARE_FAILED', error, {
        planId: 'plan-1',
        targetUserId: 'user-456',
      })
      expect(plansStore.sharedUsers).toHaveLength(1)
      expect(plansStore.isSharing).toBe(false)
    })

    it('should not unshare plan if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.unsharePlanWithUser('plan-1', 'user-456')

      expect(plansApi.unsharePlan).not.toHaveBeenCalled()
    })

    it('should not update is_shared flag when there are remaining shared users', async () => {
      plansStore.sharedUsers = [
        ...mockSharedUsers,
        {
          user_id: 'user-789',
          user_name: 'Another User',
          user_email: 'another@example.com',
          permission_level: 'view',
          shared_at: '2023-01-01T00:00:00Z',
        },
      ]

      await plansStore.unsharePlanWithUser('plan-1', 'user-456')

      expect(plansStore.sharedUsers).toHaveLength(1)
      expect(plansStore.plans[0]?.is_shared).toBe(false)
    })
  })

  describe('updateUserPermission', () => {
    beforeEach(() => {
      plansStore.sharedUsers = [...mockSharedUsers]
      vi.mocked(plansApi.updatePlanSharePermission).mockResolvedValue()
    })

    it('should update user permission successfully', async () => {
      await plansStore.updateUserPermission('plan-1', 'user-456', 'view')

      expect(plansApi.updatePlanSharePermission).toHaveBeenCalledWith('plan-1', 'user-456', 'view')
      expect(plansStore.sharedUsers[0]?.permission_level).toBe('view')
      expect(plansStore.isSharing).toBe(false)
    })

    it('should handle errors when updating user permission', async () => {
      const error = new Error('Failed to update permission')
      vi.mocked(plansApi.updatePlanSharePermission).mockRejectedValue(error)

      const originalPermission = plansStore.sharedUsers[0]?.permission_level

      await plansStore.updateUserPermission('plan-1', 'user-456', 'view')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.UPDATE_PERMISSION_FAILED', error, {
        planId: 'plan-1',
        targetUserId: 'user-456',
        permission: 'view',
      })
      expect(plansStore.sharedUsers[0]?.permission_level).toBe(originalPermission)
      expect(plansStore.isSharing).toBe(false)
    })

    it('should not update permission if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.updateUserPermission('plan-1', 'user-456', 'view')

      expect(plansApi.updatePlanSharePermission).not.toHaveBeenCalled()
    })

    it('should handle case when user is not found', async () => {
      const originalPermission = plansStore.sharedUsers[0]?.permission_level

      await plansStore.updateUserPermission('plan-1', 'non-existent-user', 'view')

      expect(plansApi.updatePlanSharePermission).toHaveBeenCalledWith(
        'plan-1',
        'non-existent-user',
        'view',
      )
      expect(plansStore.sharedUsers[0]?.permission_level).toBe(originalPermission)
    })
  })

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      vi.mocked(userApi.searchUsersByEmail).mockResolvedValue(mockUserSearchResults)

      await plansStore.searchUsers('jane@example.com')

      expect(userApi.searchUsersByEmail).toHaveBeenCalledWith('jane@example.com')
      expect(plansStore.userSearchResults).toEqual(mockUserSearchResults)
      expect(plansStore.isSearchingUsers).toBe(false)
    })

    it('should handle errors when searching users', async () => {
      const error = new Error('Failed to search')
      vi.mocked(userApi.searchUsersByEmail).mockRejectedValue(error)

      await plansStore.searchUsers('jane@example.com')

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.SEARCH_USERS_FAILED', error, {
        query: 'jane@example.com',
      })
      expect(plansStore.isSearchingUsers).toBe(false)
    })

    it('should clear results for empty query', async () => {
      plansStore.userSearchResults = [...mockUserSearchResults]

      await plansStore.searchUsers('')

      expect(userApi.searchUsersByEmail).not.toHaveBeenCalled()
      expect(plansStore.userSearchResults).toEqual([])
    })

    it('should clear results for whitespace-only query', async () => {
      plansStore.userSearchResults = [...mockUserSearchResults]

      await plansStore.searchUsers('   ')

      expect(userApi.searchUsersByEmail).not.toHaveBeenCalled()
      expect(plansStore.userSearchResults).toEqual([])
    })

    it('should set searching state correctly', async () => {
      vi.mocked(userApi.searchUsersByEmail).mockImplementation(
        () =>
          new Promise((resolve) => {
            expect(plansStore.isSearchingUsers).toBe(true)
            resolve(mockUserSearchResults)
          }),
      )

      await plansStore.searchUsers('jane@example.com')

      expect(plansStore.isSearchingUsers).toBe(false)
    })
  })

  describe('clearUserSearch', () => {
    it('should clear user search results', () => {
      plansStore.userSearchResults = [...mockUserSearchResults]
      plansStore.isSearchingUsers = true

      plansStore.clearUserSearch()

      expect(plansStore.userSearchResults).toEqual([])
      expect(plansStore.isSearchingUsers).toBe(false)
    })
  })

  describe('savePlanItems', () => {
    it('should create plan items successfully', async () => {
      const newItems = [
        {
          id: 'item-new',
          plan_id: 'plan-1',
          name: 'Bread',
          category_id: 'cat-1',
          amount: 3.5,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]
      vi.mocked(plansApi.createPlanItems).mockResolvedValue(newItems)

      const result = await plansStore.savePlanItems('plan-1', mockPlanItems)

      expect(plansApi.createPlanItems).toHaveBeenCalledWith(mockPlanItems)
      expect(result).toEqual(newItems)
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when creating plan items', async () => {
      const error = new Error('Failed to create items')
      vi.mocked(plansApi.createPlanItems).mockRejectedValue(error)

      await plansStore.savePlanItems('plan-1', mockPlanItems)

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.SAVE_ITEMS_FAILED', error, {
        planId: 'plan-1',
      })
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not create plan items if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.savePlanItems('plan-1', mockPlanItems)

      expect(plansApi.createPlanItems).not.toHaveBeenCalled()
    })
  })

  describe('removePlanItems', () => {
    it('should delete plan items successfully', async () => {
      vi.mocked(plansApi.deletePlanItems).mockResolvedValue()

      await plansStore.removePlanItems(['item-1', 'item-2'])

      expect(plansApi.deletePlanItems).toHaveBeenCalledWith(['item-1', 'item-2'])
      expect(plansStore.isLoading).toBe(false)
    })

    it('should handle errors when deleting plan items', async () => {
      const error = new Error('Failed to delete items')
      vi.mocked(plansApi.deletePlanItems).mockRejectedValue(error)

      await plansStore.removePlanItems(['item-1', 'item-2'])

      expect(mockHandleError).toHaveBeenCalledWith('PLANS.DELETE_ITEMS_FAILED', error, {
        itemIds: 'item-1, item-2',
      })
      expect(plansStore.isLoading).toBe(false)
    })

    it('should not delete plan items if user is not authenticated', async () => {
      createTestingPinia({
        createSpy: vi.fn,
        stubActions: false,
      })

      vi.mocked(useUserStore).mockReturnValue({
        ...mockUserStoreData,
        userProfile: null,
      } as unknown as ReturnType<typeof useUserStore>)

      plansStore = usePlansStore()

      await plansStore.removePlanItems(['item-1', 'item-2'])

      expect(plansApi.deletePlanItems).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    beforeEach(() => {
      plansStore.plans = [...mockPlans]
      plansStore.sharedUsers = [...mockSharedUsers]
      plansStore.userSearchResults = [...mockUserSearchResults]
      plansStore.isLoading = true
      plansStore.isSharing = true
      plansStore.isSearchingUsers = true
    })

    it('should reset all state to initial values', () => {
      plansStore.reset()

      expect(plansStore.plans).toEqual([])
      expect(plansStore.sharedUsers).toEqual([])
      expect(plansStore.userSearchResults).toEqual([])
      expect(plansStore.isLoading).toBe(false)
      expect(plansStore.isSharing).toBe(false)
      expect(plansStore.isSearchingUsers).toBe(false)
    })
  })

  describe('Loading States', () => {
    it('should manage isLoading state during plan operations', async () => {
      let resolvePromise: (value: PlanWithPermission[]) => void
      const promise = new Promise<PlanWithPermission[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(plansApi.getPlans).mockReturnValue(promise)

      const loadPromise = plansStore.loadPlans()
      expect(plansStore.isLoading).toBe(true)

      resolvePromise!(mockPlans)
      await loadPromise

      expect(plansStore.isLoading).toBe(false)
    })

    it('should manage isSharing state during sharing operations', async () => {
      let resolvePromise: (value: PlanSharedUser[]) => void
      const promise = new Promise<PlanSharedUser[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(plansApi.getPlanSharedUsers).mockReturnValue(promise)

      const loadPromise = plansStore.loadSharedUsers('plan-1')
      expect(plansStore.isLoading).toBe(true)

      resolvePromise!(mockSharedUsers)
      await loadPromise

      expect(plansStore.isLoading).toBe(false)
    })

    it('should manage isSearchingUsers state during user search', async () => {
      let resolvePromise: (value: UserSearchResult[]) => void
      const promise = new Promise<UserSearchResult[]>((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(userApi.searchUsersByEmail).mockReturnValue(promise)

      const searchPromise = plansStore.searchUsers('jane@example.com')
      expect(plansStore.isSearchingUsers).toBe(true)

      resolvePromise!(mockUserSearchResults)
      await searchPromise

      expect(plansStore.isSearchingUsers).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should always reset loading state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(plansApi.getPlans).mockRejectedValue(error)

      await plansStore.loadPlans()

      expect(plansStore.isLoading).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })

    it('should always reset sharing state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(plansApi.getPlanSharedUsers).mockRejectedValue(error)

      await plansStore.loadSharedUsers('plan-1')

      expect(plansStore.isLoading).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })

    it('should always reset searching state after errors', async () => {
      const error = new Error('Test error')
      vi.mocked(userApi.searchUsersByEmail).mockRejectedValue(error)

      await plansStore.searchUsers('jane@example.com')

      expect(plansStore.isSearchingUsers).toBe(false)
      expect(mockHandleError).toHaveBeenCalled()
    })
  })
})
