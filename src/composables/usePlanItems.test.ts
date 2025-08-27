import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { usePlanItems } from './usePlanItems'
import type { PlanWithItems } from 'src/api'
import { useCategoriesStore } from 'src/stores/categories'

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  const categoriesStore = useCategoriesStore()
  categoriesStore.categories = [
    {
      id: 'food',
      name: 'Food',
      color: '#f00',
      created_at: '',
      updated_at: '',
      icon: 'eva-pricetags-outline',
    },
  ]
  categoriesStore.getCategoryById = vi.fn().mockImplementation((categoryId: string) =>
    categoryId === 'food'
      ? {
          id: 'food',
          name: 'Food',
          color: '#f00',
          created_at: '',
          updated_at: '',
          icon: 'eva-pricetags-outline',
        }
      : undefined,
  )
})

describe('plan items manager mapping', () => {
  it('exposes items and derived flags', () => {
    const p = usePlanItems()
    expect(p.planItems.value).toEqual([])
    expect(p.hasDuplicateItems.value).toBe(false)
    expect(p.isValidForSave.value).toBe(false)
  })

  it('add/update/remove items', () => {
    const p = usePlanItems()
    p.addPlanItem('food', '#f00')
    expect(p.planItems.value.length).toBe(1)
    const id = p.planItems.value[0]!.id
    p.updatePlanItem(id, { name: 'Bread', amount: 3, categoryId: 'food', color: '#f00' })
    expect(p.totalAmount.value).toBe(3)
    p.removePlanItem(id)
    expect(p.planItems.value.length).toBe(0)
  })

  it('loads from plan entity', () => {
    const p = usePlanItems()
    const plan: PlanWithItems = {
      id: 'p1',
      owner_id: 'u',
      template_id: 'tpl1',
      name: 'Plan',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      status: 'active',
      total: 0,
      currency: 'USD',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
      plan_items: [
        {
          id: 'i1',
          plan_id: 'p1',
          name: 'Bread',
          category_id: 'food',
          amount: 5,
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
      ],
    }
    p.loadPlanItems(plan)
    expect(p.planItems.value.length).toBe(1)
    expect(p.planItems.value[0]).toMatchObject({ name: 'Bread', categoryId: 'food', amount: 5 })
  })

  it('serializes items for save and clears', () => {
    const p = usePlanItems()
    p.addPlanItem('food', '#f00')
    const id = p.planItems.value[0]!.id
    p.updatePlanItem(id, { name: ' Milk ', amount: 2, categoryId: 'food', color: '#f00' })
    const out = p.getPlanItemsForSave()
    expect(out).toEqual([{ name: 'Milk', category_id: 'food', amount: 2 }])
    p.clearPlanItems()
    expect(p.planItems.value.length).toBe(0)
  })

  it('loads from template items generating temp ids', () => {
    const p = usePlanItems()
    p.loadPlanItemsFromTemplate([{ id: 'x', name: 'Cheese', category_id: 'food', amount: 7 }])
    expect(p.planItems.value.length).toBe(1)
    expect(p.planItems.value[0]!.id.startsWith('temp_')).toBe(true)
  })
})
