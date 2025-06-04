import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import type { ThemeAdapter } from './useTheme'
import { useTheme } from './useTheme'

// Mock Dark from Quasar before installing Quasar plugin
vi.mock('quasar', () => {
  return {
    Dark: {
      set: vi.fn(),
    },
    Quasar: {},
  }
})

// Install Quasar plugin for testing
installQuasarPlugin()

// Mock matchMedia
const mockMatchMedia = () => {
  const mockMediaQueryList = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => mockMediaQueryList),
  })

  return mockMediaQueryList
}

describe('useTheme', () => {
  let mockAdapter: ThemeAdapter
  let mockMediaQueryList: ReturnType<typeof mockMatchMedia>

  beforeEach(() => {
    mockAdapter = {
      setDarkMode: vi.fn(),
    }
    mockMediaQueryList = mockMatchMedia()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return systemDarkMode reactive ref', () => {
    const isDark = ref<boolean | undefined>(false)
    const { systemDarkMode } = useTheme(isDark)

    expect(systemDarkMode).toBeDefined()
    expect(typeof systemDarkMode.value).toBe('boolean')
  })

  it('should call adapter.setDarkMode with initial isDark value', () => {
    const isDark = ref(true)
    useTheme(isDark, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
  })

  it('should call adapter.setDarkMode when isDark changes', async () => {
    const isDark = ref(false)
    useTheme(isDark, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(false)

    // Reset the mock to clearly see the next call
    vi.clearAllMocks()

    // Change the value and wait for Vue to process the reactivity
    isDark.value = true
    await nextTick()

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
  })

  it('should handle undefined isDark value by setting dark mode to false', () => {
    const isDark = ref<boolean | undefined>(undefined)
    useTheme(isDark, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(false)
  })

  it('should detect system dark mode', () => {
    mockMediaQueryList.matches = true
    const isDark = ref(false)
    const { systemDarkMode } = useTheme(isDark, { adapter: mockAdapter })

    expect(systemDarkMode.value).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('should set up listener for system dark mode changes', () => {
    const isDark = ref(false)
    useTheme(isDark)

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should call onSystemDarkModeChange callback when system preference changes', () => {
    const onSystemDarkModeChange = vi.fn()
    const isDark = ref(false)
    useTheme(isDark, { onSystemDarkModeChange })

    // Extract the callback function that was registered
    const changeListener = mockMediaQueryList.addEventListener.mock.calls[0]?.[1]
    expect(changeListener).toBeDefined()

    if (changeListener) {
      // Simulate a change event
      changeListener({ matches: true } as MediaQueryListEvent)
      expect(onSystemDarkModeChange).toHaveBeenCalledWith(true)
    }
  })

  it('should update systemDarkMode when system preference changes', () => {
    const isDark = ref(false)
    const { systemDarkMode } = useTheme(isDark)

    expect(systemDarkMode.value).toBe(false)

    // Extract the callback function that was registered
    const changeListener = mockMediaQueryList.addEventListener.mock.calls[0]?.[1]
    expect(changeListener).toBeDefined()

    if (changeListener) {
      // Simulate a change event
      changeListener({ matches: true } as MediaQueryListEvent)
      expect(systemDarkMode.value).toBe(true)
    }
  })
})
