import { nextTick } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'

import { useTemplateItems } from './useTemplateItems'
import type { TemplateWithItems } from 'src/api'
import type { TemplateItemUI } from 'src/types'
import { setupTestingPinia, setupMockCategoriesStore } from 'test/helpers/pinia-mocks'
import { createMockCategories, createMockTemplateWithItems } from 'test/fixtures'

describe('useTemplateItems', () => {
  const mockCategories = createMockCategories(3)

  beforeEach(() => {
    setupTestingPinia()
    setupMockCategoriesStore(mockCategories)
  })

  it('should initialize with empty state', () => {
    const composable = useTemplateItems()

    expect(composable.templateItems.value).toEqual([])
    expect(composable.totalAmount.value).toBe(0)
    expect(composable.hasValidItems.value).toBe(false)
    expect(composable.hasDuplicateItems.value).toBe(false)
    expect(composable.isValidForSave.value).toBe(false)
    expect(composable.categoryGroups.value).toEqual([])
  })

  describe('addTemplateItem', () => {
    it('should add a new template item', () => {
      const composable = useTemplateItems()
      const category = mockCategories[0]!

      composable.addTemplateItem(category.id, category.color)

      expect(composable.templateItems.value).toHaveLength(1)
      const addedItem = composable.templateItems.value[0]
      expect(addedItem).toMatchObject({
        name: '',
        categoryId: category.id,
        amount: 0,
        color: category.color,
      })
      expect(addedItem?.id).toMatch(/^temp_/)
    })

    it('should add multiple items', () => {
      const composable = useTemplateItems()

      composable.addTemplateItem(mockCategories[0]!.id, mockCategories[0]!.color)
      composable.addTemplateItem(mockCategories[1]!.id, mockCategories[1]!.color)

      expect(composable.templateItems.value).toHaveLength(2)
      expect(composable.templateItems.value[0]?.categoryId).toBe(mockCategories[0]!.id)
      expect(composable.templateItems.value[1]?.categoryId).toBe(mockCategories[1]!.id)
    })
  })

  describe('updateTemplateItem', () => {
    it('should update an existing item with partial data', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: 'Lunch',
        amount: 15.5,
      })

      const updatedItem = composable.templateItems.value[0]
      expect(updatedItem).toMatchObject({
        id: itemId,
        name: 'Lunch',
        categoryId: 'cat1',
        amount: 15.5,
        color: '#FF5722',
      })
    })

    it('should update an item with complete data', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      const newItem: TemplateItemUI = {
        id: itemId,
        name: 'Bus ticket',
        categoryId: 'cat2',
        amount: 3.5,
        color: '#2196F3',
      }

      composable.updateTemplateItem(itemId, newItem)

      expect(composable.templateItems.value[0]).toEqual(newItem)
    })

    it('should not update non-existent item', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const originalItem = { ...composable.templateItems.value[0]! }

      composable.updateTemplateItem('non-existent-id', { name: 'Test' })

      expect(composable.templateItems.value[0]).toEqual(originalItem)
    })
  })

  describe('removeTemplateItem', () => {
    it('should remove an existing item', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.removeTemplateItem(itemId)

      expect(composable.templateItems.value).toHaveLength(1)
      expect(composable.templateItems.value[0]?.categoryId).toBe('cat2')
    })

    it('should not affect array when removing non-existent item', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const originalLength = composable.templateItems.value.length

      composable.removeTemplateItem('non-existent-id')

      expect(composable.templateItems.value).toHaveLength(originalLength)
    })
  })

  describe('totalAmount', () => {
    it('should calculate total amount correctly', async () => {
      const composable = useTemplateItems()

      expect(composable.totalAmount.value).toBe(0)

      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { amount: 10.5 })
      composable.updateTemplateItem(itemId2, { amount: 25.75 })

      await nextTick()
      expect(composable.totalAmount.value).toBe(36.25)
    })

    it('should update when items are removed', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, { amount: 15.0 })
      await nextTick()
      expect(composable.totalAmount.value).toBe(15.0)

      composable.removeTemplateItem(itemId)
      await nextTick()
      expect(composable.totalAmount.value).toBe(0)
    })
  })

  describe('hasValidItems', () => {
    it('should return false for empty items', () => {
      const composable = useTemplateItems()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with empty names', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: '',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with whitespace-only names', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: '   ',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items without categoryId', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: 'Test',
        categoryId: '',
        amount: 10,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return false for items with zero or negative amounts', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: 'Test',
        amount: 0,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)

      composable.updateTemplateItem(itemId, { amount: -5 })
      await nextTick()
      expect(composable.hasValidItems.value).toBe(false)
    })

    it('should return true for valid items', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: 'Lunch',
        amount: 15.5,
      })

      await nextTick()
      expect(composable.hasValidItems.value).toBe(true)
    })
  })

  describe('hasDuplicateItems', () => {
    it('should return false for empty items', () => {
      const composable = useTemplateItems()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should return false for unique items', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateTemplateItem(itemId2, { name: 'Bus ticket' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should return true for duplicate name+category combinations', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateTemplateItem(itemId2, { name: 'Lunch' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should be case insensitive for duplicate detection', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateTemplateItem(itemId2, { name: 'LUNCH' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should ignore whitespace in duplicate detection', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch' })
      composable.updateTemplateItem(itemId2, { name: '  Lunch  ' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(true)
    })

    it('should allow same name in different categories', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Ticket' })
      composable.updateTemplateItem(itemId2, { name: 'Ticket' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })

    it('should ignore items with empty names or categories', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: '' })
      composable.updateTemplateItem(itemId2, { name: '' })

      await nextTick()
      expect(composable.hasDuplicateItems.value).toBe(false)
    })
  })

  describe('isValidForSave', () => {
    it('should return false when items are not valid', () => {
      const composable = useTemplateItems()
      expect(composable.isValidForSave.value).toBe(false)
    })

    it('should return false when there are duplicates', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch', amount: 10 })
      composable.updateTemplateItem(itemId2, { name: 'Lunch', amount: 15 })

      await nextTick()
      expect(composable.isValidForSave.value).toBe(false)
    })

    it('should return true when items are valid and no duplicates', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemId1 = composable.templateItems.value[0]?.id
      const itemId2 = composable.templateItems.value[1]?.id

      if (!itemId1 || !itemId2) throw new Error('Item IDs not found')

      composable.updateTemplateItem(itemId1, { name: 'Lunch', amount: 10 })
      composable.updateTemplateItem(itemId2, { name: 'Bus ticket', amount: 3.5 })

      await nextTick()
      expect(composable.isValidForSave.value).toBe(true)
    })
  })

  describe('categoryGroups', () => {
    it('should return empty array for no items', () => {
      const composable = useTemplateItems()
      expect(composable.categoryGroups.value).toEqual([])
    })

    it('should group items by category', async () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemIds = composable.templateItems.value.map((item) => item.id)

      composable.updateTemplateItem(itemIds[0]!, { name: 'Lunch', amount: 12.5 })
      composable.updateTemplateItem(itemIds[1]!, { name: 'Dinner', amount: 18.0 })
      composable.updateTemplateItem(itemIds[2]!, { name: 'Bus', amount: 3.5 })

      await nextTick()
      const groups = composable.categoryGroups.value

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
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('', '')

      const itemIds = composable.templateItems.value.map((item) => item.id)

      composable.updateTemplateItem(itemIds[0]!, { name: 'Lunch', amount: 12.5 })
      composable.updateTemplateItem(itemIds[1]!, { name: 'Invalid', amount: 5.0 })

      await nextTick()
      const groups = composable.categoryGroups.value

      expect(groups).toHaveLength(1)
      expect(groups[0]?.categoryId).toBe('cat1')
    })
  })

  describe('getUsedCategoryIds', () => {
    it('should return empty array for no items', () => {
      const composable = useTemplateItems()
      expect(composable.getUsedCategoryIds()).toEqual([])
    })

    it('should return unique category IDs', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const usedIds = composable.getUsedCategoryIds()
      expect(usedIds).toHaveLength(2)
      expect(usedIds).toContain('cat1')
      expect(usedIds).toContain('cat2')
    })

    it('should filter out empty category IDs', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('', '')

      const usedIds = composable.getUsedCategoryIds()
      expect(usedIds).toEqual(['cat1'])
    })
  })

  describe('loadTemplateItems', () => {
    it('should load items from template data', () => {
      const composable = useTemplateItems()
      const mockTemplate = createMockTemplateWithItems(2, {
        template_items: [
          {
            id: 'item1',
            template_id: 'template1',
            name: 'Lunch',
            category_id: mockCategories[0]!.id,
            amount: 12.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
          {
            id: 'item2',
            template_id: 'template1',
            name: 'Bus ticket',
            category_id: mockCategories[1]!.id,
            amount: 3.5,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      })

      composable.loadTemplateItems(mockTemplate)

      expect(composable.templateItems.value).toHaveLength(2)
      expect(composable.templateItems.value[0]).toMatchObject({
        id: 'item1',
        name: 'Lunch',
        categoryId: mockCategories[0]!.id,
        amount: 12.5,
        color: mockCategories[0]!.color,
      })
      expect(composable.templateItems.value[1]).toMatchObject({
        id: 'item2',
        name: 'Bus ticket',
        categoryId: mockCategories[1]!.id,
        amount: 3.5,
        color: mockCategories[1]!.color,
      })
    })

    it('should handle items with null names', () => {
      const composable = useTemplateItems()

      const mockTemplate: TemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: 0,
        template_items: [
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

      composable.loadTemplateItems(mockTemplate)

      expect(composable.templateItems.value[0]?.name).toBe('')
    })

    it('should skip items with unknown categories', () => {
      const composable = useTemplateItems()

      const mockTemplate: TemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: 0,
        template_items: [
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

      composable.loadTemplateItems(mockTemplate)

      expect(composable.templateItems.value).toHaveLength(1)
      expect(composable.templateItems.value[0]?.name).toBe('Valid item')
    })

    it('should replace existing items', () => {
      const composable = useTemplateItems()

      // Add some initial items
      composable.addTemplateItem('cat1', '#FF5722')
      expect(composable.templateItems.value).toHaveLength(1)

      const mockTemplate: TemplateWithItems = {
        id: 'template1',
        name: 'Test Template',
        owner_id: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        currency: 'USD',
        duration: 'monthly',
        total: 0,
        template_items: [
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

      composable.loadTemplateItems(mockTemplate)

      expect(composable.templateItems.value).toHaveLength(1)
      expect(composable.templateItems.value[0]?.name).toBe('Loaded item')
      expect(composable.templateItems.value[0]?.categoryId).toBe('cat2')
    })
  })

  describe('getTemplateItemsForSave', () => {
    it('should return empty array for no items', () => {
      const composable = useTemplateItems()
      expect(composable.getTemplateItemsForSave()).toEqual([])
    })

    it('should filter and format valid items', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')
      composable.addTemplateItem('cat3', '#4CAF50')

      const itemIds = composable.templateItems.value.map((item) => item.id)

      // Valid item
      composable.updateTemplateItem(itemIds[0]!, {
        name: '  Lunch  ', // with whitespace
        amount: 12.5,
      })

      // Invalid item - no name
      composable.updateTemplateItem(itemIds[1]!, {
        name: '',
        amount: 5.0,
      })

      // Invalid item - zero amount
      composable.updateTemplateItem(itemIds[2]!, {
        name: 'Free item',
        amount: 0,
      })

      const result = composable.getTemplateItemsForSave()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        name: 'Lunch', // trimmed
        category_id: 'cat1',
        amount: 12.5,
      })
    })

    it('should filter out items without category', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')

      const itemId = composable.templateItems.value[0]?.id

      if (!itemId) throw new Error('Item ID not found')

      composable.updateTemplateItem(itemId, {
        name: 'Test',
        categoryId: '',
        amount: 10,
      })

      const result = composable.getTemplateItemsForSave()
      expect(result).toEqual([])
    })

    it('should handle multiple valid items', () => {
      const composable = useTemplateItems()
      composable.addTemplateItem('cat1', '#FF5722')
      composable.addTemplateItem('cat2', '#2196F3')

      const itemIds = composable.templateItems.value.map((item) => item.id)

      composable.updateTemplateItem(itemIds[0]!, {
        name: 'Lunch',
        amount: 12.5,
      })

      composable.updateTemplateItem(itemIds[1]!, {
        name: 'Bus ticket',
        amount: 3.5,
      })

      const result = composable.getTemplateItemsForSave()

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
