import { defineBoot } from '#q-app/wrappers'
import { VueQueryPlugin, QueryClient, QueryCache } from '@tanstack/vue-query'
import { useError } from 'src/composables/useError'
import type { ErrorMessageKey } from 'src/config/error-messages'

declare module '@tanstack/vue-query' {
  interface Register {
    queryMeta: { errorKey?: ErrorMessageKey }
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const errorKey = query.meta?.errorKey
      if (errorKey) {
        const { handleError } = useError()
        handleError(errorKey, error)
      }
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
