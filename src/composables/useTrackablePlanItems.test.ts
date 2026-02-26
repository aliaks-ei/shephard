import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { groupTrackablePlanItemsByCategory, useTrackablePlanItems } from './useTrackablePlanItems'
import type { Category, PlanItem } from 'src/api'

const planItems: PlanItem[] = [
  {
    id: 'a',
    plan_id: 'plan-1',
    category_id: 'cat-2',
    name: 'Completed fixed',
    amount: 20,
    is_completed: true,
    is_fixed_payment: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Incomplete fixed',
    amount: 10,
    is_completed: false,
    is_fixed_payment: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c',
    plan_id: 'plan-1',
    category_id: 'cat-1',
    name: 'Reference item',
    amount: 5,
    is_completed: false,
    is_fixed_payment: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('useTrackablePlanItems', () => {
  it('splits fixed and non-fixed items and sorts fixed by completion state', () => {
    const { fixedPlanItems, nonFixedPlanItems, completedItemsCount, totalItemsCount } =
      useTrackablePlanItems(ref(planItems))

    expect(fixedPlanItems.value.map((item) => item.id)).toEqual(['b', 'a'])
    expect(nonFixedPlanItems.value.map((item) => item.id)).toEqual(['c'])
    expect(completedItemsCount.value).toBe(1)
    expect(totalItemsCount.value).toBe(2)
  })
})

describe('groupTrackablePlanItemsByCategory', () => {
  const categoriesById = new Map<string, Category>([
    [
      'cat-1',
      {
        id: 'cat-1',
        name: 'Alpha',
        color: '#111111',
        icon: 'eva-a',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    [
      'cat-2',
      {
        id: 'cat-2',
        name: 'Beta',
        color: '#222222',
        icon: 'eva-b',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
  ])

  it('groups by category and includes both fixed and non-fixed items', () => {
    const groups = groupTrackablePlanItemsByCategory(planItems, (categoryId) =>
      categoriesById.get(categoryId),
    )

    expect(groups.map((group) => group.categoryName)).toEqual(['Alpha', 'Beta'])
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['b'])
    expect(groups[0]?.nonFixedItems.map((item) => item.id)).toEqual(['c'])
    expect(groups[1]?.items.map((item) => item.id)).toEqual(['a'])
  })
})
