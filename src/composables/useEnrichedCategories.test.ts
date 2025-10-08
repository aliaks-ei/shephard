import { computed, ref } from 'vue'
import { describe, expect, it } from 'vitest'
import { useEnrichedCategories } from './useEnrichedCategories'
import type { Tables } from 'src/lib/supabase/types'
import type { CategoryGroup } from './useItemsManager'
import type { BaseItemUI } from 'src/types'

type Category = Tables<'categories'>

describe('useEnrichedCategories', () => {
  it('enriches category groups with category details from array', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
      {
        id: 'cat-2',
        name: 'Transport',
        color: '#3357FF',
        icon: 'eva-car-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ]

    const categoryGroups = computed(
      () =>
        [
          {
            categoryId: 'cat-1',
            items: [
              {
                id: 'item-1',
                categoryId: 'cat-1',
                name: 'Groceries',
                amount: 100,
                color: '#FF5733',
              },
            ],
          },
          {
            categoryId: 'cat-2',
            items: [
              { id: 'item-2', categoryId: 'cat-2', name: 'Bus', amount: 50, color: '#3357FF' },
            ],
          },
        ] as CategoryGroup<BaseItemUI>[],
    )

    const { enrichedCategories } = useEnrichedCategories(categoryGroups, categories)

    expect(enrichedCategories.value).toHaveLength(2)
    expect(enrichedCategories.value[0]).toEqual({
      categoryId: 'cat-1',
      categoryName: 'Food',
      categoryIcon: 'eva-shopping-bag-outline',
      items: [
        { id: 'item-1', categoryId: 'cat-1', name: 'Groceries', amount: 100, color: '#FF5733' },
      ],
    })
    expect(enrichedCategories.value[1]).toEqual({
      categoryId: 'cat-2',
      categoryName: 'Transport',
      categoryIcon: 'eva-car-outline',
      items: [{ id: 'item-2', categoryId: 'cat-2', name: 'Bus', amount: 50, color: '#3357FF' }],
    })
  })

  it('enriches category groups with category details from computed ref', () => {
    const categories = computed(() => [
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ])

    const categoryGroups = computed(
      () =>
        [
          {
            categoryId: 'cat-1',
            items: [
              {
                id: 'item-1',
                categoryId: 'cat-1',
                name: 'Groceries',
                amount: 100,
                color: '#FF5733',
              },
            ],
          },
        ] as CategoryGroup<BaseItemUI>[],
    )

    const { enrichedCategories } = useEnrichedCategories(categoryGroups, categories)

    expect(enrichedCategories.value).toHaveLength(1)
    expect(enrichedCategories.value[0]?.categoryName).toBe('Food')
  })

  it('filters out category groups without matching categories', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ]

    const categoryGroups = computed(
      () =>
        [
          {
            categoryId: 'cat-1',
            items: [
              {
                id: 'item-1',
                categoryId: 'cat-1',
                name: 'Groceries',
                amount: 100,
                color: '#FF5733',
              },
            ],
          },
          {
            categoryId: 'cat-999',
            items: [
              {
                id: 'item-2',
                categoryId: 'cat-999',
                name: 'Unknown',
                amount: 50,
                color: '#666666',
              },
            ],
          },
        ] as CategoryGroup<BaseItemUI>[],
    )

    const { enrichedCategories } = useEnrichedCategories(categoryGroups, categories)

    expect(enrichedCategories.value).toHaveLength(1)
    expect(enrichedCategories.value[0]?.categoryId).toBe('cat-1')
  })

  it('returns empty array when no category groups exist', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ]

    const categoryGroups = computed(() => [] as CategoryGroup<BaseItemUI>[])

    const { enrichedCategories } = useEnrichedCategories(categoryGroups, categories)

    expect(enrichedCategories.value).toEqual([])
  })

  it('reacts to changes in category groups', () => {
    const categories: Category[] = [
      {
        id: 'cat-1',
        name: 'Food',
        color: '#FF5733',
        icon: 'eva-shopping-bag-outline',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ]

    const categoryGroupsRef = ref([] as CategoryGroup<BaseItemUI>[])
    const categoryGroups = computed(() => categoryGroupsRef.value)

    const { enrichedCategories } = useEnrichedCategories(categoryGroups, categories)

    expect(enrichedCategories.value).toEqual([])

    categoryGroupsRef.value = [
      {
        categoryId: 'cat-1',
        items: [
          { id: 'item-1', categoryId: 'cat-1', name: 'Groceries', amount: 100, color: '#FF5733' },
        ],
      },
    ] as CategoryGroup<BaseItemUI>[]

    expect(enrichedCategories.value).toHaveLength(1)
    expect(enrichedCategories.value[0]?.categoryName).toBe('Food')
  })
})
