import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PostgrestError } from '@supabase/supabase-js'
import * as plansApi from './plans'
import { supabase } from 'src/lib/supabase/client'

vi.mock('src/utils/database', () => ({
  isDuplicateNameError: vi.fn(),
  createDuplicateNameError: vi.fn(),
}))

const mockSupabase = vi.mocked(supabase, true)
const mockFrom = vi.fn()
const mockIsDuplicateNameError = vi.mocked(await import('src/utils/database')).isDuplicateNameError
const mockCreateDuplicateNameError = vi.mocked(
  await import('src/utils/database'),
).createDuplicateNameError

describe('plans API', () => {
  const mockUserId = 'user-123'
  const mockPlanId = 'plan-123'
  const mockPlan: plansApi.Plan = {
    id: mockPlanId,
    name: 'Test Plan',
    owner_id: mockUserId,
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    status: 'active',
    template_id: 'template-123',
    currency: 'USD',
    total: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from = mockFrom
  })

  describe('getPlans', () => {
    it('should return owned and shared plans combined and sorted', async () => {
      const mockOwnedPlans = [
        { ...mockPlan, plan_shares: [{ id: 'share-1' }] },
        { ...mockPlan, id: 'plan-2', plan_shares: [] },
      ]
      const mockSharedPlansData = [
        {
          permission_level: 'view',
          plans: { ...mockPlan, id: 'shared-plan-1', owner_id: 'other-user' },
        },
      ]

      // Mock the first query for owned plans
      const mockOwnedQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockOwnedPlans,
          error: null,
        }),
      }

      // Mock the second query for shared plans
      const mockSharedQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockSharedPlansData,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

      const result = await plansApi.getPlans(mockUserId)

      expect(mockFrom).toHaveBeenCalledWith('plans')
      expect(mockFrom).toHaveBeenCalledWith('plan_shares')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({
        ...mockPlan,
        is_shared: true,
      })
      expect(result[1]).toEqual({
        ...mockPlan,
        id: 'plan-2',
        is_shared: false,
      })
      expect(result[2]).toEqual({
        ...mockPlan,
        id: 'shared-plan-1',
        owner_id: 'other-user',
        permission_level: 'view',
      })
    })

    it('should throw error if owned plans query fails', async () => {
      const mockError = { message: 'Database error' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.getPlans(mockUserId)).rejects.toEqual(mockError)
    })

    it('should throw error if shared plans query fails', async () => {
      const mockError = { message: 'Database error' }

      // Mock successful owned plans query
      const mockOwnedQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      // Mock failed shared plans query
      const mockSharedQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockOwnedQuery).mockReturnValueOnce(mockSharedQuery)

      await expect(plansApi.getPlans(mockUserId)).rejects.toEqual(mockError)
    })
  })

  describe('createPlan', () => {
    const mockPlanInsert: plansApi.PlanInsert = {
      name: 'New Plan',
      owner_id: mockUserId,
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'active',
      template_id: 'template-123',
    }

    it('should create a new plan successfully', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockPlan,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.createPlan(mockPlanInsert)

      expect(mockFrom).toHaveBeenCalledWith('plans')
      expect(mockQuery.insert).toHaveBeenCalledWith(mockPlanInsert)
      expect(result).toEqual(mockPlan)
    })

    it('should handle duplicate name error', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "unique_plan_name_per_user"',
      } as PostgrestError

      const mockDuplicateError = new Error('DUPLICATE_PLAN_NAME')
      mockIsDuplicateNameError.mockReturnValue(true)
      mockCreateDuplicateNameError.mockReturnValue(mockDuplicateError)

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.createPlan(mockPlanInsert)).rejects.toEqual(mockDuplicateError)
      expect(mockIsDuplicateNameError).toHaveBeenCalledWith(mockError, 'unique_plan_name_per_user')
      expect(mockCreateDuplicateNameError).toHaveBeenCalledWith('PLAN')
    })

    it('should throw generic error for non-duplicate errors', async () => {
      const mockError = { message: 'Generic database error' }
      mockIsDuplicateNameError.mockReturnValue(false)

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.createPlan(mockPlanInsert)).rejects.toEqual(mockError)
    })
  })

  describe('updatePlan', () => {
    const mockPlanUpdate: plansApi.PlanUpdate = {
      name: 'Updated Plan',
      status: 'completed',
    }

    it('should update a plan successfully', async () => {
      const updatedPlan = { ...mockPlan, ...mockPlanUpdate }
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedPlan,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.updatePlan(mockPlanId, mockPlanUpdate)

      expect(mockFrom).toHaveBeenCalledWith('plans')
      expect(mockQuery.update).toHaveBeenCalledWith(mockPlanUpdate)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockPlanId)
      expect(result).toEqual(updatedPlan)
    })

    it('should handle duplicate name error on update', async () => {
      const mockError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "unique_plan_name_per_user"',
      } as PostgrestError

      const mockDuplicateError = new Error('DUPLICATE_PLAN_NAME')
      mockIsDuplicateNameError.mockReturnValue(true)
      mockCreateDuplicateNameError.mockReturnValue(mockDuplicateError)

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.updatePlan(mockPlanId, mockPlanUpdate)).rejects.toEqual(
        mockDuplicateError,
      )
    })
  })

  describe('deletePlan', () => {
    it('should delete a plan successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await plansApi.deletePlan(mockPlanId)

      expect(mockFrom).toHaveBeenCalledWith('plans')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', mockPlanId)
    })

    it('should throw error if delete fails', async () => {
      const mockError = { message: 'Delete failed' }
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.deletePlan(mockPlanId)).rejects.toEqual(mockError)
    })
  })

  describe('getPlanWithItems', () => {
    const mockPlanItems = [
      {
        id: 'item-1',
        plan_id: mockPlanId,
        name: 'Item 1',
        amount: 100,
        category_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    const mockPlanWithItems = {
      ...mockPlan,
      plan_items: mockPlanItems,
    }

    it('should return plan with items for owner', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockPlanWithItems,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.getPlanWithItems(mockPlanId, mockUserId)

      expect(mockFrom).toHaveBeenCalledWith('plans')
      expect(result).toEqual(mockPlanWithItems)
    })

    it('should return plan with permission level for shared user', async () => {
      const otherUserId = 'other-user-123'
      const planOwnedByOther = { ...mockPlanWithItems, owner_id: 'plan-owner' }

      // Mock plan query
      const mockPlanQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: planOwnedByOther,
          error: null,
        }),
      }

      // Mock share query
      const mockShareQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { permission_level: 'view' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockPlanQuery).mockReturnValueOnce(mockShareQuery)

      const result = await plansApi.getPlanWithItems(mockPlanId, otherUserId)

      expect(result).toEqual({
        ...planOwnedByOther,
        permission_level: 'view',
      })
    })

    it('should return null if plan not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.getPlanWithItems(mockPlanId, mockUserId)

      expect(result).toBeNull()
    })

    it('should throw error if plan not shared with user', async () => {
      const otherUserId = 'other-user-123'
      const planOwnedByOther = { ...mockPlanWithItems, owner_id: 'plan-owner' }

      // Mock plan query
      const mockPlanQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: planOwnedByOther,
          error: null,
        }),
      }

      // Mock share query - no share found
      const mockShareQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockPlanQuery).mockReturnValueOnce(mockShareQuery)

      await expect(plansApi.getPlanWithItems(mockPlanId, otherUserId)).rejects.toThrow(
        'Plan not found or access denied',
      )
    })

    it('should throw error if plan query fails', async () => {
      const mockError = { message: 'Database error' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.getPlanWithItems(mockPlanId, mockUserId)).rejects.toEqual(mockError)
    })
  })

  describe('getPlanSharedUsers', () => {
    const mockShares = [
      {
        shared_with_user_id: 'user-1',
        permission_level: 'view',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        shared_with_user_id: 'user-2',
        permission_level: 'edit',
        created_at: '2024-01-02T00:00:00Z',
      },
    ]

    const mockUsers = [
      {
        id: 'user-1',
        name: 'User One',
        email: 'user1@example.com',
      },
      {
        id: 'user-2',
        name: 'User Two',
        email: 'user2@example.com',
      },
    ]

    it('should return shared users with details', async () => {
      // Mock shares query
      const mockSharesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockShares,
          error: null,
        }),
      }

      // Mock users query
      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockSharesQuery).mockReturnValueOnce(mockUsersQuery)

      const result = await plansApi.getPlanSharedUsers(mockPlanId)

      expect(mockFrom).toHaveBeenCalledWith('plan_shares')
      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(result).toEqual([
        {
          user_id: 'user-1',
          user_name: 'User One',
          user_email: 'user1@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01T00:00:00Z',
        },
        {
          user_id: 'user-2',
          user_name: 'User Two',
          user_email: 'user2@example.com',
          permission_level: 'edit',
          shared_at: '2024-01-02T00:00:00Z',
        },
      ])
    })

    it('should return empty array if no shares exist', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.getPlanSharedUsers(mockPlanId)

      expect(result).toEqual([])
    })

    it('should handle missing user details gracefully', async () => {
      const mockSharesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockShares,
          error: null,
        }),
      }

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: [mockUsers[0]], // Only first user found
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockSharesQuery).mockReturnValueOnce(mockUsersQuery)

      const result = await plansApi.getPlanSharedUsers(mockPlanId)

      expect(result).toEqual([
        {
          user_id: 'user-1',
          user_name: 'User One',
          user_email: 'user1@example.com',
          permission_level: 'view',
          shared_at: '2024-01-01T00:00:00Z',
        },
        {
          user_id: 'user-2',
          user_name: '',
          user_email: '',
          permission_level: 'edit',
          shared_at: '2024-01-02T00:00:00Z',
        },
      ])
    })

    it('should throw error if shares query fails', async () => {
      const mockError = { message: 'Database error' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.getPlanSharedUsers(mockPlanId)).rejects.toEqual(mockError)
    })

    it('should throw error if users query fails', async () => {
      const mockError = { message: 'Database error' }

      const mockSharesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockShares,
          error: null,
        }),
      }

      const mockUsersQuery = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockSharesQuery).mockReturnValueOnce(mockUsersQuery)

      await expect(plansApi.getPlanSharedUsers(mockPlanId)).rejects.toEqual(mockError)
    })
  })

  describe('sharePlan', () => {
    const userEmail = 'user@example.com'
    const sharedByUserId = 'sharer-123'

    it('should share plan successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: userEmail,
      }

      // Mock user lookup query
      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      }

      // Mock existing share check query
      const mockShareCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      // Mock insert query
      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockShareCheckQuery)
        .mockReturnValueOnce(mockInsertQuery)

      await plansApi.sharePlan(mockPlanId, userEmail, 'view', sharedByUserId)

      expect(mockFrom).toHaveBeenCalledWith('users')
      expect(mockFrom).toHaveBeenCalledWith('plan_shares')
      expect(mockInsertQuery.insert).toHaveBeenCalledWith({
        plan_id: mockPlanId,
        shared_with_user_id: mockUser.id,
        shared_by_user_id: sharedByUserId,
        permission_level: 'view',
      })
    })

    it('should throw error if user not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(
        plansApi.sharePlan(mockPlanId, userEmail, 'view', sharedByUserId),
      ).rejects.toThrow(`User not found: ${userEmail}`)
    })

    it('should throw error if plan already shared with user', async () => {
      const mockUser = {
        id: 'user-123',
        email: userEmail,
      }

      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      }

      const mockShareCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-share' },
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValueOnce(mockUserQuery).mockReturnValueOnce(mockShareCheckQuery)

      await expect(
        plansApi.sharePlan(mockPlanId, userEmail, 'view', sharedByUserId),
      ).rejects.toThrow(`Plan is already shared with ${userEmail}`)
    })

    it('should throw error if user lookup fails', async () => {
      const mockError = { message: 'Database error' }
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(
        plansApi.sharePlan(mockPlanId, userEmail, 'view', sharedByUserId),
      ).rejects.toEqual(mockError)
    })

    it('should throw error if insert fails', async () => {
      const mockError = { message: 'Insert failed' }
      const mockUser = {
        id: 'user-123',
        email: userEmail,
      }

      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      }

      const mockShareCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      const mockInsertQuery = {
        insert: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      }

      mockSupabase.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockShareCheckQuery)
        .mockReturnValueOnce(mockInsertQuery)

      await expect(
        plansApi.sharePlan(mockPlanId, userEmail, 'view', sharedByUserId),
      ).rejects.toEqual(mockError)
    })
  })

  describe('unsharePlan', () => {
    const userId = 'user-123'

    it('should unshare plan successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }

      // Mock the chained eq calls
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce({
        error: null,
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await plansApi.unsharePlan(mockPlanId, userId)

      expect(mockFrom).toHaveBeenCalledWith('plan_shares')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('plan_id', mockPlanId)
      expect(mockQuery.eq).toHaveBeenCalledWith('shared_with_user_id', userId)
    })

    it('should throw error if delete fails', async () => {
      const mockError = { message: 'Delete failed' }
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }

      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce({
        error: mockError,
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.unsharePlan(mockPlanId, userId)).rejects.toEqual(mockError)
    })
  })

  describe('updatePlanSharePermission', () => {
    const userId = 'user-123'

    it('should update permission successfully', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }

      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce({
        error: null,
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await plansApi.updatePlanSharePermission(mockPlanId, userId, 'edit')

      expect(mockFrom).toHaveBeenCalledWith('plan_shares')
      expect(mockQuery.update).toHaveBeenCalledWith({ permission_level: 'edit' })
      expect(mockQuery.eq).toHaveBeenCalledWith('plan_id', mockPlanId)
      expect(mockQuery.eq).toHaveBeenCalledWith('shared_with_user_id', userId)
    })

    it('should throw error if update fails', async () => {
      const mockError = { message: 'Update failed' }
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      }

      mockQuery.eq.mockReturnValueOnce(mockQuery).mockReturnValueOnce({
        error: mockError,
      })

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.updatePlanSharePermission(mockPlanId, userId, 'edit')).rejects.toEqual(
        mockError,
      )
    })
  })

  describe('createPlanItems', () => {
    const mockPlanItems: plansApi.PlanItemInsert[] = [
      {
        plan_id: mockPlanId,
        name: 'Item 1',
        amount: 100,
        category_id: 'cat-1',
      },
      {
        plan_id: mockPlanId,
        name: 'Item 2',
        amount: 200,
        category_id: 'cat-2',
      },
    ]

    const mockCreatedItems: plansApi.PlanItem[] = [
      {
        id: 'item-1',
        plan_id: mockPlanId,
        name: 'Item 1',
        amount: 100,
        category_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'item-2',
        plan_id: mockPlanId,
        name: 'Item 2',
        amount: 200,
        category_id: 'cat-2',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    it('should create plan items successfully', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: mockCreatedItems,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await plansApi.createPlanItems(mockPlanItems)

      expect(mockFrom).toHaveBeenCalledWith('plan_items')
      expect(mockQuery.insert).toHaveBeenCalledWith(mockPlanItems)
      expect(result).toEqual(mockCreatedItems)
    })

    it('should throw error if insert fails', async () => {
      const mockError = { message: 'Insert failed' }
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.createPlanItems(mockPlanItems)).rejects.toEqual(mockError)
    })
  })

  describe('deletePlanItems', () => {
    const itemIds = ['item-1', 'item-2', 'item-3']

    it('should delete plan items successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await plansApi.deletePlanItems(itemIds)

      expect(mockFrom).toHaveBeenCalledWith('plan_items')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.in).toHaveBeenCalledWith('id', itemIds)
    })

    it('should throw error if delete fails', async () => {
      const mockError = { message: 'Delete failed' }
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({
          error: mockError,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(plansApi.deletePlanItems(itemIds)).rejects.toEqual(mockError)
    })
  })
})
