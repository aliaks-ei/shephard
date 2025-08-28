import { vi } from 'vitest'
import { ref } from 'vue'
import { setActivePinia } from 'pinia'
import { createTestingPinia, type TestingPinia } from '@pinia/testing'
import { useCategoriesStore } from 'src/stores/categories'
import { createMockCategories, createMockUserStoreData } from '../fixtures'

/**
 * Creates and configures a testing Pinia instance
 */
export const setupTestingPinia = (
  options: {
    stubActions?: boolean
    createSpy?: typeof vi.fn
  } = {},
): TestingPinia => {
  const pinia = createTestingPinia({
    createSpy: options.createSpy || vi.fn,
    stubActions: options.stubActions ?? false,
  })
  setActivePinia(pinia)
  return pinia
}

/**
 * Sets up a mock categories store with predefined data
 */
export const setupMockCategoriesStore = (
  categories = createMockCategories(),
): ReturnType<typeof useCategoriesStore> => {
  const store = useCategoriesStore()

  // @ts-expect-error - Testing Pinia
  store.categories = ref(categories)
  // @ts-expect-error - Testing Pinia
  store.isLoading = ref(false)

  // Mock the getCategoryById method
  store.getCategoryById = vi.fn((id: string) => {
    const category = categories.find((cat) => cat.id === id)
    return category ? { ...category, templates: [] } : undefined
  })

  return store
}

/**
 * Sets up a mock user store with predefined data
 */
export const setupMockUserStore = (userData = createMockUserStoreData()) => {
  const mockUserStore = {
    userProfile: userData.userProfile,
    preferences: userData.preferences,
  }

  vi.mock('src/stores/user', () => ({
    useUserStore: vi.fn(() => mockUserStore),
  }))

  return mockUserStore
}

/**
 * Utility to mock store state properties easily
 */
export const mockStoreState = <T>(store: T, stateUpdates: Partial<T>) => {
  Object.keys(stateUpdates).forEach((key) => {
    const value = stateUpdates[key as keyof T]
    // @ts-expect-error - Testing Pinia
    store[key] = ref(value)
  })
}

/**
 * Helper to create spies for store actions
 */
export const createStoreActionSpies = <T extends Record<string, unknown>>(
  store: T,
  actionNames: (keyof T)[],
): Record<keyof T, ReturnType<typeof vi.fn>> => {
  const spies = {} as Record<keyof T, ReturnType<typeof vi.fn>>

  actionNames.forEach((actionName) => {
    // @ts-expect-error - Complex generic typing for test utilities
    spies[actionName] = vi.spyOn(store, actionName as string)
  })

  return spies
}
