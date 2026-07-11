import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys } from './query-keys'
import { useTemplateDetailQuery, useUpdateTemplateWithItemsMutation } from './templates'

const mocks = vi.hoisted(() => ({
  useMutation: vi.fn(),
  useQuery: vi.fn(),
  invalidateQueries: vi.fn(),
  updateTemplateWithItems: vi.fn(),
  getEntityLoadErrorKind: vi.fn(),
}))

vi.mock('@tanstack/vue-query', () => ({
  useMutation: mocks.useMutation,
  useQuery: mocks.useQuery,
  useQueryClient: () => ({
    invalidateQueries: mocks.invalidateQueries,
  }),
}))

vi.mock('src/api', () => ({
  getTemplates: vi.fn(),
  getTemplateWithItems: vi.fn(),
  createTemplate: vi.fn(),
  createTemplateWithItems: vi.fn(),
  updateTemplate: vi.fn(),
  updateTemplateWithItems: mocks.updateTemplateWithItems,
  deleteTemplate: vi.fn(),
  createTemplateItems: vi.fn(),
  deleteTemplateItems: vi.fn(),
  getEntityLoadErrorKind: mocks.getEntityLoadErrorKind,
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'user-1' },
  }),
}))

vi.mock('./query-error-handler', () => ({
  createSpecificErrorHandler: vi.fn(() => vi.fn()),
  createMutationErrorHandler: vi.fn(() => vi.fn()),
}))

type MutationOptions = {
  mutationFn: (variables: {
    id: string
    updates: { name: string }
    items: Array<{
      name: string
      category_id: string
      amount: number
      is_fixed_payment: boolean
    }>
  }) => Promise<{ id: string }>
  onSuccess: (data: { id: string }) => void
}

type QueryOptions = {
  queryKey: { value: readonly unknown[] }
  enabled: { value: boolean }
  retry: (failureCount: number, error: Error) => boolean
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useMutation.mockImplementation((options) => options)
  mocks.useQuery.mockImplementation((options) => options)
})

describe('template query contracts', () => {
  it('invalidates the user list and edited detail after an atomic update', async () => {
    const variables = {
      id: 'template-1',
      updates: { name: 'Updated template' },
      items: [
        {
          name: 'Rent',
          category_id: 'category-1',
          amount: 900,
          is_fixed_payment: true,
        },
      ],
    }
    mocks.updateTemplateWithItems.mockResolvedValue({ id: 'template-1' })

    useUpdateTemplateWithItemsMutation()
    const options = mocks.useMutation.mock.calls[0]?.[0] as MutationOptions

    const updatedTemplate = await options.mutationFn(variables)
    options.onSuccess(updatedTemplate)

    expect(mocks.updateTemplateWithItems).toHaveBeenCalledWith(
      variables.id,
      variables.updates,
      variables.items,
    )
    expect(mocks.invalidateQueries.mock.calls.map(([options]) => options)).toEqual([
      { queryKey: queryKeys.templates.list('user-1') },
      { queryKey: queryKeys.templates.detail('template-1', 'user-1') },
    ])
  })

  it('keys detail data by template and user and retries only transient first failures', () => {
    useTemplateDetailQuery('template-1', 'user-1')
    const options = mocks.useQuery.mock.calls[0]?.[0] as QueryOptions
    const error = new Error('load failed')

    expect(options.queryKey.value).toEqual(queryKeys.templates.detail('template-1', 'user-1'))
    expect(options.enabled.value).toBe(true)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('not-found')
    expect(options.retry(0, error)).toBe(false)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('access-denied')
    expect(options.retry(0, error)).toBe(false)

    mocks.getEntityLoadErrorKind.mockReturnValueOnce('transient')
    expect(options.retry(0, error)).toBe(true)
    expect(options.retry(1, error)).toBe(false)
  })
})
