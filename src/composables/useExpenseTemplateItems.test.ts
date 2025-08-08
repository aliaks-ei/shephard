import { nextTick } from 'vue'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useExpenseTemplateItems } from './useExpenseTemplateItems'
import { useCategoriesStore } from 'src/stores/categories'
import type { ExpenseTemplateWithItems } from 'src/api'
import type { ExpenseTemplateItemUI } from 'src/types'

let pinia: TestingPinia

describe('useExpenseTemplateItems', () => {
  let categoriesStore: ReturnType<typeof useCategoriesStore>

  const mockCategories = [
    {
      id: 'cat1',
      name: 'Food',
      color: '#FF5722',
      owner_id: 'user1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'cat2',
      name: 'Transport',
      color: '#2196F3',
      owner_id: 'user1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 'cat3',
      name: 'Entertainment',
      color: '#4CAF50',
      owner_id: 'user1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
  ]

  beforeEach(() => {
    pinia = createTestingPinia({ createSpy: vi.fn })
    setActivePinia(pinia)
    categoriesStore = useCategoriesStore()

    // Mock getCategoryById method
    categoriesStore.getCategoryById = vi.fn((id: string) =>
      mockCategories.find((cat) => cat.id === id),
    )
  })

  it('should initialize with empty state', () => {
    const composable = useExpenseTemplateItems()

    expect(composable.expenseTemplateItems.value).toEqual([])
    expect(composable.totalAmount.value).toBe(0)
    expect(composable.hasValidItems.value).toBe(false)
    expect(composable.hasDuplicateItems.value).toBe(false)
    expect(composable.isValidForSave.value).toBe(false)
    expect(composable.expenseCategoryGroups.value).toEqual([])
  })

  describe('addExpenseTemplateItem', () => {
    it('should add a new expense template item', () => {
      const composable = useExpenseTemplateItems()

      composable.addExpenseTemplateItem('cat1', '#FF5722')

      expect(composable.expenseTemplateItems.value).toHaveLength(1)
      const addedItem = composable.expenseTemplateItems.value[0]
      expect(addedItem).toMatchObject({
        name: '',
        categoryId: 'cat1',
        amount: 0,
        color: '#FF5722',
      })
      expect(addedItem?.id).toMatch(/^temp_/)
    })

    it('should add multiple items', () => {
      const composable = useExpenseTemplateItems()

      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      expect(composable.expenseTemplateItems.value).toHaveLength(2)
      expect(composable.expenseTemplateItems.value[0]?.categoryId).toBe('cat1')
      expect(composable.expenseTemplateItems.value[1]?.categoryId).toBe('cat2')
    })
  })

  describe('updateExpenseTemplateItem', () => {
    it('should update an existing item with partial data', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: 'Lunch',
        amount: 15.5,
      })

      const updatedItem = composable.expenseTemplateItems.value[0]
      expect(updatedItem).toMatchObject({
        id: itemId,
        name: 'Lunch',
        categoryId: 'cat1',
        amount: 15.5,
        color: '#FF5722',
      })
    })

    it('should update an item with complete data', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      const newItem: ExpenseTemplateItemUI = {
        id: itemId,
        name: 'Bus ticket',
        categoryId: 'cat2',
        amount: 3.5,
        color: '#2196F3',
      }

      composable.updateExpenseTemplateItem(itemId, newItem)

      expect(composable.expenseTemplateItems.value[0]).toEqual(newItem)
    })

    it('should not update non-existent item', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const originalItem = { ...composable.expenseTemplateItems.value[0]! }

      composable.updateExpenseTemplateItem('non-existent-id', { name: 'Test' })

      expect(composable.expenseTemplateItems.value[0]).toEqual(originalItem)
    })
  })

  describe('removeExpenseTemplateItem', () => {
    it('should remove an existing item', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.removeExpenseTemplateItem(itemId)

      expect(composable.expenseTemplateItems.value).toHaveLength(1)
      expect(composable.expenseTemplateItems.value[0]?.categoryId).toBe('cat2')
    })

    it('should not affect array when removing non-existent item', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const originalLength = composable.expenseTemplateItems.value.length

      composable.removeExpenseTemplateItem('non-existent-id')

      expect(composable.expenseTemplateItems.value).toHaveLength(originalLength)
    })
  })

  describe('totalAmount', () => {
    it('should calculate total amount correctly', async () => {
      const composable = useExpenseTemplateItems()

      expect(composable.totalAmount.value).toBe(0)

      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { amount: 10.5 })
      composable.updateExpenseTemplateItem(itemId2, { amount: 25.75 })

      await nextTick()
      expect(composable.totalAmount.value).toBe(36.25)
    })

    it('should update when items are removed', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, { amount: 15.0 })
      await nextTick()
      expect(composable.totalAmount.value).toBe(15.0)

      composable.removeExpenseTemplateItem(itemId)
      await nextTick()
      expect(composable.totalAmount.value).toBe(0)
    })
  })

  describe('hasValidItems', () => {
    it('should return false for empty items', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with empty names', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: '',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with whitespace-only names', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: '   ',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items without categoryId', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: 'Test',
        categoryId: '',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with zero or negative amounts', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: 'Test',
        amount: 0,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)

      composable.updateExpenseTemplateItem(itemId, { amount: -5 })
      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return true for valid items', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: 'Lunch',
        amount: 15.5,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(true)
    })
  })

  describe('hasDuplicateItems', () => {
    it('should return false for empty items', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should return false for unique items', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateExpenseTemplateItem(itemId2, { name: 'Bus ticket' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should return true for duplicate name+category combinations', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateExpenseTemplateItem(itemId2, { name: 'Lunch' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should be case insensitive for duplicate detection', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateExpenseTemplateItem(itemId2, { name: 'LUNCH' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should ignore whitespace in duplicate detection', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateExpenseTemplateItem(itemId2, { name: '  Lunch  ' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should allow same name in different categories', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Ticket' })
      composable.updateExpenseTemplateItem(itemId2, { name: 'Ticket' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should ignore items with empty names or categories', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: '' })
      composable.updateExpenseTemplateItem(itemId2, { name: '' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })
  })

  describe('isValidForSave', () => {
    it('should return false when items are not valid', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.isValidForSave.value).toBe(false)
    })

    it('should return false when there are duplicates', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch', amount: 10 })
      composable.updateExpenseTemplateItem(itemId2, { name: 'Lunch', amount: 15 })

      await nextTick()
      expect(composable.isValidForSave.value).toBe(false)
    })

    it('should return true when items are valid and no duplicates', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.expenseTemplateItems.value[0]?.id
      const itemId2 = composable.expenseTemplateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateExpenseTemplateItem(itemId1, { name: 'Lunch', amount: 10 })
      composable.updateExpenseTemplateItem(itemId2, { name: 'Bus ticket', amount: 3.5 })

      await nextTick()
      expect(composable.isValidForSave.value).toBe(true)
    })
  })

  describe('expenseCategoryGroups', () => {
    it('should return empty array for no items', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.expenseCategoryGroups.value).toEqual([])
    })

    it('should group items by category', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemIds = composable.expenseTemplateItems.value.map((item) => item.id)

      composable.updateExpenseTemplateItem(itemIds[0]!, { name: 'Lunch', amount: 12.5 })
      composable.updateExpenseTemplateItem(itemIds[1]!, { name: 'Dinner', amount: 18.0 })
      composable.updateExpenseTemplateItem(itemIds[2]!, { name: 'Bus', amount: 3.5 })

      await nextTick()
      const groups = composable.expenseCategoryGroups.value

      expect(groups).toHaveLength(2)

      const foodGroup = groups.find((g) => g.categoryId === 'cat1')
      expect(foodGroup).toMatchObject({
        categoryId: 'cat1',
        categoryColor: '#FF5722',
        subtotal: 30.5,
      })
      expect(foodGroup?.items).toHaveLength(2)

      const transportGroup = groups.find((g) => g.categoryId === 'cat2')
      expect(transportGroup).toMatchObject({
        categoryId: 'cat2',
        categoryColor: '#2196F3',
        subtotal: 3.5,
      })
      expect(transportGroup?.items).toHaveLength(1)
    })

    it('should ignore items without categoryId', async () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('', '')

      const itemIds = composable.expenseTemplateItems.value.map((item) => item.id)

      composable.updateExpenseTemplateItem(itemIds[0]!, { name: 'Lunch', amount: 12.5 })
      composable.updateExpenseTemplateItem(itemIds[1]!, { name: 'Invalid', amount: 5.0 })

      await nextTick()
      const groups = composable.expenseCategoryGroups.value

      expect(groups).toHaveLength(1)
      expect(groups[0]?.categoryId).toBe('cat1')
    })
  })

  describe('getUsedCategoryIds', () => {
    it('should return empty array for no items', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.getUsedCategoryIds()).toEqual([])
    })

    it('should return unique category IDs', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const usedIds = composable.getUsedCategoryIds()
      expect(usedIds).toHaveLength(2)
      expect(usedIds).toContain('cat1')
      expect(usedIds).toContain('cat2')
    })

    it('should filter out empty category IDs', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('', '')

      const usedIds = composable.getUsedCategoryIds()
      expect(usedIds).toEqual(['cat1'])
    })
  })

  describe('loadExpenseTemplateItems', () => {
    it('should load items from template data', () => {
      const composable = useExpenseTemplateItems()

      const mockTemplate: ExpenseTemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: null,
        expense_template_items: [
          {
            id: 'item1',
            template_id: 'template1',
            name: 'Lunch',
            category_id: 'cat1',
            amount: 12.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item2',
            template_id: 'template1',
            name: 'Bus ticket',
            category_id: 'cat2',
            amount: 3.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      composable.loadExpenseTemplateItems(mockTemplate)

      expect(composable.expenseTemplateItems.value).toHaveLength(2)
      expect(composable.expenseTemplateItems.value[0]).toMatchObject({
        id: 'item1',
        name: 'Lunch',
        categoryId: 'cat1',
        amount: 12.5,
        color: '#FF5722',
      })
      expect(composable.expenseTemplateItems.value[1]).toMatchObject({
        id: 'item2',
        name: 'Bus ticket',
        categoryId: 'cat2',
        amount: 3.5,
        color: '#2196F3',
      })
    })

    it('should handle items with null names', () => {
      const composable = useExpenseTemplateItems()

      const mockTemplate: ExpenseTemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: null,
        expense_template_items: [
          {
            id: 'item1',
            template_id: 'template1',
            name: '',
            category_id: 'cat1',
            amount: 12.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      composable.loadExpenseTemplateItems(mockTemplate)

      expect(composable.expenseTemplateItems.value[0]?.name).toBe('')
    })

    it('should skip items with unknown categories', () => {
      const composable = useExpenseTemplateItems()

      const mockTemplate: ExpenseTemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: null,
        expense_template_items: [
          {
            id: 'item1',
            template_id: 'template1',
            name: 'Valid item',
            category_id: 'cat1',
            amount: 12.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item2',
            template_id: 'template1',
            name: 'Invalid item',
            category_id: 'unknown-category',
            amount: 5.0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      composable.loadExpenseTemplateItems(mockTemplate)

      expect(composable.expenseTemplateItems.value).toHaveLength(1)
      expect(composable.expenseTemplateItems.value[0]?.name).toBe('Valid item')
    })

    it('should replace existing items', () => {
      const composable = useExpenseTemplateItems()

      // Add some initial items
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      expect(composable.expenseTemplateItems.value).toHaveLength(1)

      const mockTemplate: ExpenseTemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: null,
        expense_template_items: [
          {
            id: 'item1',
            template_id: 'template1',
            name: 'Loaded item',
            category_id: 'cat2',
            amount: 10.0,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      }

      composable.loadExpenseTemplateItems(mockTemplate)

      expect(composable.expenseTemplateItems.value).toHaveLength(1)
      expect(composable.expenseTemplateItems.value[0]?.name).toBe('Loaded item')
      expect(composable.expenseTemplateItems.value[0]?.categoryId).toBe('cat2')
    })
  })

  describe('getExpenseTemplateItemsForSave', () => {
    it('should return empty array for no items', () => {
      const composable = useExpenseTemplateItems()
      expect(composable.getExpenseTemplateItemsForSave()).toEqual([])
    })

    it('should filter and format valid items', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')
      composable.addExpenseTemplateItem('cat3', '#4CAF50')

      const itemIds = composable.expenseTemplateItems.value.map((item) => item.id)

      // Valid item
      composable.updateExpenseTemplateItem(itemIds[0]!, {
        name: '  Lunch  ', // with whitespace
        amount: 12.5,
      })

      // Invalid item - no name
      composable.updateExpenseTemplateItem(itemIds[1]!, {
        name: '',
        amount: 5.0,
      })

      // Invalid item - zero amount
      composable.updateExpenseTemplateItem(itemIds[2]!, {
        name: 'Free item',
        amount: 0,
      })

      const result = composable.getExpenseTemplateItemsForSave()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'Lunch', // trimmed
        category_id: 'cat1',
        amount: 12.5,
      })
    })

    it('should filter out items without category', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')

      const itemId = composable.expenseTemplateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateExpenseTemplateItem(itemId, {
        name: 'Test',
        categoryId: '',
        amount: 10,
      })

      const result = composable.getExpenseTemplateItemsForSave()
      expect(result).toEqual([])
    })

    it('should handle multiple valid items', () => {
      const composable = useExpenseTemplateItems()
      composable.addExpenseTemplateItem('cat1', '#FF5722')
      composable.addExpenseTemplateItem('cat2', '#2196F3')

      const itemIds = composable.expenseTemplateItems.value.map((item) => item.id)

      composable.updateExpenseTemplateItem(itemIds[0]!, {
        name: 'Lunch',
        amount: 12.5,
      })

      composable.updateExpenseTemplateItem(itemIds[1]!, {
        name: 'Bus ticket',
        amount: 3.5,
      })

      const result = composable.getExpenseTemplateItemsForSave()

      expect(result).toHaveLength(2)
      expect(result).toEqual([
        {
          name: 'Lunch',
          category_id: 'cat1',
          amount: 12.5,
        },
        {
          name: 'Bus ticket',
          category_id: 'cat2',
          amount: 3.5,
        },
      ])
    })
  })
})
