import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { useItemsManager } from './useItemsManager'
import { useCategoriesStore } from 'src/stores/categories'
import type { BaseItemUI } from 'src/types'

type TestItem = BaseItemUI

const createItemForSave = (item: TestItem) => ({
  name: item.name.trim(),
  category_id: item.categoryId,
  amount: item.amount,
})

let pinia: TestingPinia

beforeEach(() => {
  pinia = createTestingPinia({ createSpy: vi.fn })
  setActivePinia(pinia)
  const categoriesStore = useCategoriesStore()
  categoriesStore.categories = [
    {
      id: 'c1',
      name: 'Food',
      color: '#f00',
      created_at: '',
      updated_at: '',
      icon: 'eva-pricetags-outline',
      templates: [],
    },
    {
      id: 'c2',
      name: 'Rent',
      color: '#0f0',
      created_at: '',
      updated_at: '',
      icon: 'eva-pricetags-outline',
      templates: [],
    },
  ]
  categoriesStore.getCategoryById = vi.fn().mockImplementation((categoryId: string) =>
    categoryId === 'c1'
      ? {
          id: 'c1',
          name: 'Food',
          color: '#f00',
          created_at: '',
          owner_id: 'u',
          updated_at: '',
          icon: 'eva-pricetags-outline',
        }
      : categoryId === 'c2'
        ? {
            id: 'c2',
            name: 'Rent',
            color: '#0f0',
            created_at: '',
            owner_id: 'u',
            updated_at: '',
            icon: 'eva-pricetags-outline',
          }
        : undefined,
  )
})

describe('initialization', () => {
  it('starts with empty items and derived state', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    expect(m.items.value).toEqual([])
    expect(m.totalAmount.value).toBe(0)
    expect(m.hasValidItems.value).toBe(false)
    expect(m.hasDuplicateItems.value).toBe(false)
    expect(m.isValidForSave.value).toBe(false)
    expect(m.categoryGroups.value).toEqual([])
  })
})

describe('add/update/remove', () => {
  it('adds item with provided category and color', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    expect(m.items.value.length).toBe(1)
    const item = m.items.value[0]!
    expect(item.categoryId).toBe('c1')
    expect(item.color).toBe('#f00')
  })

  it('updates existing item by id', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    const id = m.items.value[0]!.id
    m.updateItem(id, { name: 'Apples', amount: 10, categoryId: 'c1', color: '#f00' })
    expect(m.items.value[0]).toMatchObject({ name: 'Apples', amount: 10 })
  })

  it('removeItem deletes item by id', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    const id = m.items.value[0]!.id
    m.removeItem(id)
    expect(m.items.value.length).toBe(0)
  })
})

describe('validation and duplicates', () => {
  it('calculates total and validity', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    const id = m.items.value[0]!.id
    m.updateItem(id, { name: 'Apples', amount: 25, categoryId: 'c1', color: '#f00' })
    expect(m.totalAmount.value).toBe(25)
    expect(m.hasValidItems.value).toBe(true)
    expect(m.isValidForSave.value).toBe(true)
  })

  it('flags duplicates by name+category when both set and name non-empty', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    m.addItem('c1', '#f00')
    const [a, b] = m.items.value
    m.updateItem(a!.id, { name: 'Apples', amount: 5, categoryId: 'c1', color: '#f00' })
    m.updateItem(b!.id, { name: 'apples', amount: 7, categoryId: 'c1', color: '#f00' })
    expect(m.hasDuplicateItems.value).toBe(true)
    expect(m.isValidForSave.value).toBe(false)
  })
})

describe('grouping and used categories', () => {
  it('groups items by category and computes subtotals', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    m.addItem('c2', '#0f0')
    const [a, b] = m.items.value
    m.updateItem(a!.id, { name: 'Apples', amount: 10, categoryId: 'c1', color: '#f00' })
    m.updateItem(b!.id, { name: 'Rent', amount: 1000, categoryId: 'c2', color: '#0f0' })

    const groups = m.categoryGroups.value
    expect(groups.length).toBe(2)
    const g1 = groups.find((g) => g.categoryId === 'c1')
    const g2 = groups.find((g) => g.categoryId === 'c2')
    expect(g1?.subtotal).toBe(10)
    expect(g2?.subtotal).toBe(1000)
    expect(m.getUsedCategoryIds()).toEqual(['c1', 'c2'])
  })
})

describe('loading and serialization', () => {
  it('loads items from entity using categories for color', () => {
    const m = useItemsManager<TestItem>({
      itemsPropertyName: 'entity_items',
      createItemForSave,
    })
    const entity = {
      entity_items: [
        { id: 'i1', name: 'Bread', category_id: 'c1', amount: 4 },
        { id: 'i2', name: 'Flat', category_id: 'c2', amount: 900 },
      ],
    }
    m.loadItemsFromEntity(entity)
    expect(m.items.value.length).toBe(2)
    expect(m.items.value[0]).toMatchObject({ color: '#f00' })
    expect(m.items.value[1]).toMatchObject({ color: '#0f0' })
  })

  it('loads items from template mapping to temp ids', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.loadItemsFromTemplate([{ id: 'x', name: 'Cheese', category_id: 'c1', amount: 8 }])
    expect(m.items.value.length).toBe(1)
    expect(m.items.value[0]!.id.startsWith('temp_')).toBe(true)
  })

  it('getItemsForSave filters invalid and maps via factory', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    const id = m.items.value[0]!.id
    m.updateItem(id, { name: ' Milk ', amount: 3, categoryId: 'c1', color: '#f00' })
    m.addItem('c2', '#0f0')
    // leave second item invalid
    const saved = m.getItemsForSave()
    expect(saved).toEqual([{ name: 'Milk', category_id: 'c1', amount: 3 }])
  })

  it('clearItems resets items array', () => {
    const m = useItemsManager<TestItem>({ itemsPropertyName: 'items', createItemForSave })
    m.addItem('c1', '#f00')
    expect(m.items.value.length).toBe(1)
    m.clearItems()
    expect(m.items.value.length).toBe(0)
  })
})
