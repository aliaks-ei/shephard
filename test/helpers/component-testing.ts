import { mount, type VueWrapper, type ComponentMountingOptions } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, expect } from 'vitest'
import { setupTestingPinia, setupMockCategoriesStore } from './pinia-mocks'
import { createMockCategories } from '../fixtures'
import type { Component } from 'vue'

const { mockNotify, mockDialog } = vi.hoisted(() => ({
  mockNotify: vi.fn(),
  mockDialog: vi.fn(),
}))

vi.mock('quasar', () => ({
  Quasar: {},
  Notify: {
    create: mockNotify,
    registerType: vi.fn(),
    setDefaults: vi.fn(),
  },
  Dialog: {
    create: mockDialog,
  },
  Dark: {
    set: vi.fn(),
    isActive: false,
    mode: 'auto',
  },
  Loading: {
    show: vi.fn(),
    hide: vi.fn(),
  },
}))

/**
 * Sets up Quasar testing environment with common mocks
 */
export const setupQuasarTesting = () => {
  installQuasarPlugin()

  return { mockNotify, mockDialog }
}

/**
 * Creates a component renderer with common testing setup
 */
export const createComponentRenderer = <T extends Component>(
  component: T,
  defaultOptions: ComponentMountingOptions<T> = {},
) => {
  const render = (
    props: Record<string, unknown> = {},
    options: ComponentMountingOptions<T> = {},
  ) => {
    // Setup Pinia for each render
    const pinia = setupTestingPinia()

    // Setup common store mocks
    setupMockCategoriesStore()

    // Merge options
    const mountOptions = {
      props,
      global: {
        plugins: [pinia],
        provide: {},
        stubs: {
          // Common stubs for router components
          'router-link': true,
          'router-view': true,
          // Quasar components that might cause issues in tests
          'q-intersection': true,
        },
        ...options.global,
      },
      ...defaultOptions,
      ...options,
    } as ComponentMountingOptions<T>

    return mount(component, mountOptions)
  }

  return { render }
}

/**
 * Helper for testing components that use categories
 */
export const renderWithCategories = <T extends Component>(
  component: T,
  categories = createMockCategories(),
  options: ComponentMountingOptions<T> = {},
) => {
  const pinia = setupTestingPinia()
  const categoriesStore = setupMockCategoriesStore(categories)

  return {
    wrapper: mount(component, {
      global: {
        plugins: [pinia],
        provide: {},
        stubs: {
          'router-link': true,
          'router-view': true,
        },
        ...options.global,
      },
      ...options,
    }),
    categoriesStore,
    pinia,
  }
}

/**
 * Helper for testing list components with common props
 */
export const renderListComponent = <T extends Component>(
  component: T,
  items: unknown[] = [],
  options: ComponentMountingOptions<T> = {},
) => {
  const { render } = createComponentRenderer(component, options)

  return render(
    {
      items,
      loading: false,
      searchQuery: '',
      sortBy: 'name',
      ...options.props,
    },
    options,
  )
}

/**
 * Helper for testing dialog components
 */
export const renderDialog = <T extends Component>(
  component: T,
  isOpen: boolean = true,
  options: ComponentMountingOptions<T> = {},
) => {
  const { render } = createComponentRenderer(component, {
    global: {
      stubs: {
        // Dialog wrapper components
        'q-dialog': true,
        'q-card': true,
        'q-card-section': true,
        'q-card-actions': true,
        ...options.global?.stubs,
      },
    },
  })

  return render(
    {
      modelValue: isOpen,
      ...options.props,
    },
    options,
  )
}

/**
 * Helper for testing form components
 */
export const renderForm = <T extends Component>(
  component: T,
  formData: Record<string, unknown> = {},
  options: ComponentMountingOptions<T> = {},
) => {
  const { render } = createComponentRenderer(component, {
    global: {
      stubs: {
        // Form components that might need stubbing
        'q-form': true,
        'q-input': true,
        'q-select': true,
        'q-btn': true,
        ...options.global?.stubs,
      },
    },
  })

  return render(
    {
      ...formData,
      ...options.props,
    },
    options,
  )
}

/**
 * Utility to trigger events and wait for updates
 */
export const triggerAndWait = async (
  wrapper: VueWrapper,
  selector: string,
  event: string,
  eventData?: unknown,
) => {
  const element = wrapper.find(selector)
  await element.trigger(event, eventData as Record<string, unknown>)
  await wrapper.vm.$nextTick()
}

/**
 * Utility to find component by test attribute
 */
export const findByTestId = (wrapper: VueWrapper, testId: string) => {
  return wrapper.find(`[data-testid="${testId}"]`)
}

/**
 * Utility to check if component emitted an event
 */
export const expectEmitted = (
  wrapper: VueWrapper,
  eventName: string,
  expectedPayload?: unknown,
) => {
  const emittedEvents = wrapper.emitted(eventName)
  expect(emittedEvents).toBeTruthy()

  if (expectedPayload !== undefined && emittedEvents) {
    const lastEmittedEvent = emittedEvents[emittedEvents.length - 1]
    expect(lastEmittedEvent).toEqual([expectedPayload])
  }
}

/**
 * Utility for testing async component behavior
 */
export const waitForAsyncBehavior = async (
  wrapper: VueWrapper,
  condition: () => boolean,
  timeout: number = 1000,
) => {
  const startTime = Date.now()

  while (!condition() && Date.now() - startTime < timeout) {
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms timeout`)
  }
}
