import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { usePlanActions, type PlanActionsContext } from './usePlanActions'
import type { PlanWithItems } from 'src/api'

describe('usePlanActions', () => {
  const createMockPlan = (
    status: 'pending' | 'active' | 'completed' | 'cancelled',
  ): PlanWithItems => {
    const now = new Date()
    const dates = {
      pending: {
        start_date: new Date(now.getTime() + 86400000).toISOString().split('T')[0]!,
        end_date: new Date(now.getTime() + 172800000).toISOString().split('T')[0]!,
      },
      active: {
        start_date: new Date(now.getTime() - 86400000).toISOString().split('T')[0]!,
        end_date: new Date(now.getTime() + 86400000).toISOString().split('T')[0]!,
      },
      completed: {
        start_date: new Date(now.getTime() - 172800000).toISOString().split('T')[0]!,
        end_date: new Date(now.getTime() - 86400000).toISOString().split('T')[0]!,
      },
      cancelled: {
        start_date: new Date(now.getTime() - 86400000).toISOString().split('T')[0]!,
        end_date: new Date(now.getTime() + 86400000).toISOString().split('T')[0]!,
      },
    }

    return {
      id: 'plan-1',
      name: 'Test Plan',
      start_date: dates[status].start_date,
      end_date: dates[status].end_date,
      status: status === 'cancelled' ? 'cancelled' : 'active',
      owner_id: 'user-1',
      template_id: 'template-1',
      currency: 'USD',
      total: null,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      plan_items: [],
    }
  }

  const createContext = (overrides?: Partial<PlanActionsContext>): PlanActionsContext => ({
    isNewPlan: ref(false),
    isOwner: ref(true),
    isEditMode: ref(true),
    canEditPlanData: ref(true),
    currentPlan: ref(createMockPlan('active')),
    currentTab: ref('edit'),
    handlers: {
      onSave: vi.fn(),
      onShare: vi.fn(),
      onCancel: vi.fn(),
      onDelete: vi.fn(),
      onAddExpense: vi.fn(),
      onSwitchToEdit: vi.fn(),
    },
    ...overrides,
  })

  describe('edit mode actions', () => {
    it('shows Create button for new plan', () => {
      const context = createContext({ isNewPlan: ref(true) })
      const { actionBarActions } = usePlanActions(context)

      const saveAction = actionBarActions.value.find((a) => a.key === 'save')
      expect(saveAction?.label).toBe('Create')
      expect(saveAction?.color).toBe('primary')
    })

    it('shows Save button for existing plan', () => {
      const context = createContext({ isNewPlan: ref(false) })
      const { actionBarActions } = usePlanActions(context)

      const saveAction = actionBarActions.value.find((a) => a.key === 'save')
      expect(saveAction?.label).toBe('Save')
      expect(saveAction?.color).toBe('positive')
    })

    it('shows Share button when not new plan and user can edit', () => {
      const context = createContext({
        isNewPlan: ref(false),
        isEditMode: ref(true),
      })
      const { actionBarActions } = usePlanActions(context)

      const shareAction = actionBarActions.value.find((a) => a.key === 'share')
      expect(shareAction?.visible).toBe(true)
    })

    it('hides Share button when user cannot edit', () => {
      const context = createContext({
        isNewPlan: ref(false),
        isEditMode: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const shareAction = actionBarActions.value.find((a) => a.key === 'share')
      expect(shareAction?.visible).toBe(false)
    })

    it('hides Share button for new plan', () => {
      const context = createContext({ isNewPlan: ref(true) })
      const { actionBarActions } = usePlanActions(context)

      const shareAction = actionBarActions.value.find((a) => a.key === 'share')
      expect(shareAction?.visible).toBe(false)
    })

    it('shows Cancel button for active plan when user can edit', () => {
      const context = createContext({
        isNewPlan: ref(false),
        isEditMode: ref(true),
        currentPlan: ref(createMockPlan('active')),
      })
      const { actionBarActions } = usePlanActions(context)

      const cancelAction = actionBarActions.value.find((a) => a.key === 'cancel')
      expect(cancelAction?.visible).toBe(true)
    })

    it('hides Cancel button for non-active plan', () => {
      const context = createContext({
        currentPlan: ref(createMockPlan('completed')),
      })
      const { actionBarActions } = usePlanActions(context)

      const cancelAction = actionBarActions.value.find((a) => a.key === 'cancel')
      expect(cancelAction?.visible).toBe(false)
    })

    it('shows Delete button for completed plan when user can edit', () => {
      const context = createContext({
        currentPlan: ref(createMockPlan('completed')),
      })
      const { actionBarActions } = usePlanActions(context)

      const deleteAction = actionBarActions.value.find((a) => a.key === 'delete')
      expect(deleteAction?.visible).toBe(true)
    })

    it('shows Delete button for pending plan when user can edit', () => {
      const context = createContext({
        currentPlan: ref(createMockPlan('pending')),
      })
      const { actionBarActions } = usePlanActions(context)

      const deleteAction = actionBarActions.value.find((a) => a.key === 'delete')
      expect(deleteAction?.visible).toBe(true)
    })

    it('hides Delete button for active plan', () => {
      const context = createContext({
        currentPlan: ref(createMockPlan('active')),
      })
      const { actionBarActions } = usePlanActions(context)

      const deleteAction = actionBarActions.value.find((a) => a.key === 'delete')
      expect(deleteAction?.visible).toBe(false)
    })
  })

  describe('overview tab actions', () => {
    it('shows Add Expense button when in edit mode', () => {
      const context = createContext({
        currentTab: ref('overview'),
        isEditMode: ref(true),
        isNewPlan: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const addExpenseAction = actionBarActions.value.find((a) => a.key === 'add-expense')
      expect(addExpenseAction?.visible).toBe(true)
    })

    it('shows Edit button when in edit mode and can edit plan data', () => {
      const context = createContext({
        currentTab: ref('overview'),
        isEditMode: ref(true),
        canEditPlanData: ref(true),
        isNewPlan: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const editAction = actionBarActions.value.find((a) => a.key === 'edit')
      expect(editAction?.visible).toBe(true)
    })

    it('hides Edit button when cannot edit plan data', () => {
      const context = createContext({
        currentTab: ref('overview'),
        isEditMode: ref(true),
        canEditPlanData: ref(false),
        isNewPlan: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const editAction = actionBarActions.value.find((a) => a.key === 'edit')
      expect(editAction?.visible).toBe(false)
    })

    it('shows Share button when user can edit', () => {
      const context = createContext({
        currentTab: ref('overview'),
        isEditMode: ref(true),
        isNewPlan: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const shareAction = actionBarActions.value.find((a) => a.key === 'share')
      expect(shareAction?.visible).toBe(true)
    })
  })

  describe('items tab actions', () => {
    it('shows correct actions for items tab', () => {
      const context = createContext({
        currentTab: ref('items'),
        isEditMode: ref(true),
        isNewPlan: ref(false),
      })
      const { actionBarActions } = usePlanActions(context)

      const addExpenseAction = actionBarActions.value.find((a) => a.key === 'add-expense')
      const editAction = actionBarActions.value.find((a) => a.key === 'edit')

      expect(addExpenseAction?.visible).toBe(true)
      expect(editAction?.visible).toBe(true)
    })
  })

  describe('actionsVisible', () => {
    it('returns true for new plan in edit mode', () => {
      const context = createContext({
        isNewPlan: ref(true),
        isEditMode: ref(true),
      })
      const { actionsVisible } = usePlanActions(context)

      expect(actionsVisible.value).toBe(true)
    })

    it('returns true for overview tab', () => {
      const context = createContext({
        currentTab: ref('overview'),
        isNewPlan: ref(false),
      })
      const { actionsVisible } = usePlanActions(context)

      expect(actionsVisible.value).toBe(true)
    })

    it('returns true for items tab in edit mode', () => {
      const context = createContext({
        currentTab: ref('items'),
        isEditMode: ref(true),
        isNewPlan: ref(false),
      })
      const { actionsVisible } = usePlanActions(context)

      expect(actionsVisible.value).toBe(true)
    })

    it('returns true for edit tab in edit mode', () => {
      const context = createContext({
        currentTab: ref('edit'),
        isEditMode: ref(true),
        isNewPlan: ref(false),
      })
      const { actionsVisible } = usePlanActions(context)

      expect(actionsVisible.value).toBe(true)
    })
  })

  describe('action handlers', () => {
    it('calls correct handlers when actions are triggered', () => {
      const handlers = {
        onSave: vi.fn(),
        onShare: vi.fn(),
        onCancel: vi.fn(),
        onDelete: vi.fn(),
        onAddExpense: vi.fn(),
        onSwitchToEdit: vi.fn(),
      }
      const context = createContext({ handlers })
      const { actionBarActions } = usePlanActions(context)

      const saveAction = actionBarActions.value.find((a) => a.key === 'save')
      saveAction?.handler()

      expect(handlers.onSave).toHaveBeenCalled()
    })
  })
})
