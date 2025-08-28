import { vi, type MockedFunction } from 'vitest'

/**
 * Creates a generic mock function that can resolve or reject
 */
export const createMockApiFunction = <TReturn, TParams extends unknown[] = unknown[]>(
  defaultResolveValue?: TReturn,
): MockedFunction<(...args: TParams) => Promise<TReturn>> => {
  const mockFn = vi.fn() as MockedFunction<(...args: TParams) => Promise<TReturn>>

  if (defaultResolveValue !== undefined) {
    mockFn.mockResolvedValue(defaultResolveValue as Awaited<TReturn>)
  }

  return mockFn
}

/**
 * Sets up a mock API module with common CRUD operations
 */
export const setupApiModuleMocks = <T>(modulePath: string) => {
  const mocks = {
    create: createMockApiFunction<T>(),
    update: createMockApiFunction<T>(),
    delete: createMockApiFunction<void>(),
    getById: createMockApiFunction<T>(),
    getAll: createMockApiFunction<T[]>(),
    search: createMockApiFunction<T[]>(),
  }

  vi.mock(modulePath, () => mocks)

  return mocks
}

/**
 * Helper to quickly setup success/error scenarios for API functions
 */
export const setupApiScenarios = <T>(mockFn: MockedFunction<() => Promise<T>>) => ({
  success: (data: T) => mockFn.mockResolvedValue(data as Awaited<T>),
  error: (error: Error) => mockFn.mockRejectedValue(error),
  loading: () => {
    let resolver: (value: T) => void
    const promise = new Promise<T>((resolve) => {
      resolver = resolve
    })
    mockFn.mockReturnValue(promise)
    return resolver!
  },
  reset: () => mockFn.mockReset(),
})

/**
 * Mocks an entire API module with all its exports
 */
export const mockApiModule = <T extends Record<string, unknown>>(
  modulePath: string,
  mockExports: Partial<T> = {},
): Record<keyof T, MockedFunction<(...args: unknown[]) => unknown>> => {
  const mockedExports = Object.keys(mockExports).reduce(
    (acc, key) => {
      acc[key as keyof T] = vi.fn()
      return acc
    },
    {} as Record<keyof T, MockedFunction<(...args: unknown[]) => unknown>>,
  )

  vi.mock(modulePath, () => mockedExports)

  return mockedExports
}

/**
 * Utility to create consistent error objects for API testing
 */
export const createApiError = (message: string, code?: string, status?: number) => {
  const error = new Error(message)
  if (code) error.name = code
  if (status) (error as unknown as { status: number }).status = status
  return error
}
