import { defineBoot } from '#q-app/wrappers'
import { VueQueryPlugin, QueryClient, QueryCache, MutationCache } from '@tanstack/vue-query'
import { useError } from 'src/composables/useError'
import { requireOnline } from 'src/composables/useNetworkStatus'
import type { ErrorMessageKey } from 'src/config/error-messages'

declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: { errorKey?: ErrorMessageKey; handledInline?: boolean }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const errorKey = query.meta?.errorKey
      const isHandledInline = query.meta?.handledInline === true && query.state.data === undefined
      if (errorKey && !isHandledInline) {
        const { handleError } = useError()
        handleError(errorKey, error)
      }
    },
  }),
  mutationCache: new MutationCache({
    onMutate: () => {
      requireOnline()
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
})

export default defineBoot(({ app }) => {
  app.use(VueQueryPlugin, { queryClient })
})
