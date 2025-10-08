import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import type { ThemeAdapter } from './useTheme'
import { useTheme } from './useTheme'
import type { ThemePreference } from 'src/api/user'

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

describe('useTheme', () => {
  let mockAdapter: ThemeAdapter
  let mockMediaQueryList: {
    matches: boolean
    addEventListener: ReturnType<typeof vi.fn>
    removeEventListener: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockAdapter = {
      setDarkMode: vi.fn(),
    }

    mockMediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation(() => mockMediaQueryList),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return systemDarkMode and isDark reactive refs', () => {
    const theme = ref<ThemePreference>('light')
    const { systemDarkMode, isDark } = useTheme(theme)

    expect(systemDarkMode).toBeDefined()
    expect(typeof systemDarkMode.value).toBe('boolean')
    expect(isDark).toBeDefined()
    expect(typeof isDark.value).toBe('boolean')
  })

  it('should set dark mode when theme is "dark"', () => {
    const theme = ref<ThemePreference>('dark')
    useTheme(theme, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
  })

  it('should set light mode when theme is "light"', () => {
    const theme = ref<ThemePreference>('light')
    useTheme(theme, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(false)
  })

  it('should use system preference when theme is "system"', async () => {
    mockMediaQueryList.matches = true
    const theme = ref<ThemePreference>('system')
    useTheme(theme, { adapter: mockAdapter })

    await nextTick()
    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
  })

  it('should call adapter.setDarkMode when theme preference changes', async () => {
    const theme = ref<ThemePreference>('light')
    useTheme(theme, { adapter: mockAdapter })

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(false)

    vi.clearAllMocks()

    theme.value = 'dark'
    await nextTick()

    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
  })

  it('should detect system dark mode', () => {
    mockMediaQueryList.matches = true
    const theme = ref<ThemePreference>('light')
    const { systemDarkMode } = useTheme(theme, { adapter: mockAdapter })

    expect(systemDarkMode.value).toBe(true)
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
  })

  it('should set up listener for system dark mode changes', () => {
    const theme = ref<ThemePreference>('light')
    useTheme(theme)

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('should update systemDarkMode when system preference changes', () => {
    const theme = ref<ThemePreference>('light')
    const { systemDarkMode } = useTheme(theme)

    expect(systemDarkMode.value).toBe(false)

    const changeListener = mockMediaQueryList.addEventListener.mock.calls[0]?.[1]
    expect(changeListener).toBeDefined()

    if (changeListener) {
      changeListener({ matches: true } as MediaQueryListEvent)
      expect(systemDarkMode.value).toBe(true)
    }
  })

  it('should update dark mode when system preference changes and theme is "system"', async () => {
    mockMediaQueryList.matches = false
    const theme = ref<ThemePreference>('system')
    useTheme(theme, { adapter: mockAdapter })

    await nextTick()
    expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(false)

    const changeListener = mockMediaQueryList.addEventListener.mock.calls[0]?.[1]
    expect(changeListener).toBeDefined()

    vi.clearAllMocks()

    if (changeListener) {
      changeListener({ matches: true } as MediaQueryListEvent)
      await nextTick()
      expect(mockAdapter.setDarkMode).toHaveBeenCalledWith(true)
    }
  })
})
