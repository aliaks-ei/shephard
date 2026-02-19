import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import { setupTestingPinia } from './pinia-mocks'
import type { Component } from 'vue'

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function mountWithQuery<T extends Component>(
  component: T,
  options: ComponentMountingOptions<T> = {},
) {
  const queryClient = createTestQueryClient()
  const pinia = setupTestingPinia()

  return mount(component, {
    ...options,
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], ...(options.global?.plugins || [])],
      stubs: {
        'router-link': true,
        'router-view': true,
        ...options.global?.stubs,
      },
      provide: {
        ...options.global?.provide,
      },
      ...options.global,
    },
  })
}

export function flushQueryPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}
