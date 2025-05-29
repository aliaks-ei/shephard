import { Dark } from 'quasar'
import { watch, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export type ThemeAdapter = {
  setDarkMode: (isDark: boolean) => void
}

export const QuasarThemeAdapter: ThemeAdapter = {
  setDarkMode: (isDark: boolean) => {
    Dark.set(isDark)
  },
}

export function useTheme(
  isDark: Ref<boolean | undefined>,
  options?: {
    onSystemDarkModeChange?: (isSystemDark: boolean) => void
    adapter?: ThemeAdapter
  },
) {
  const adapter = options?.adapter ?? QuasarThemeAdapter
  const systemDarkMode = ref(false)
  let systemDarkModeListener: MediaQueryList | null = null

  function setupSystemDarkModeListener() {
    if (window.matchMedia) {
      systemDarkModeListener = window.matchMedia('(prefers-color-scheme: dark)')
      systemDarkMode.value = systemDarkModeListener.matches

      const handleSystemDarkModeChange = (e: MediaQueryListEvent) => {
        systemDarkMode.value = e.matches
        options?.onSystemDarkModeChange?.(e.matches)
      }

      systemDarkModeListener.addEventListener('change', handleSystemDarkModeChange)
    }
  }

  function cleanupSystemDarkModeListener() {
    if (systemDarkModeListener) {
      systemDarkModeListener.removeEventListener('change', () => {})
      systemDarkModeListener = null
    }
  }

  const stopWatcher = watch(
    isDark,
    () => {
      adapter.setDarkMode(!!isDark.value)
    },
    { immediate: true },
  )

  setupSystemDarkModeListener()

  onUnmounted(() => {
    stopWatcher()
    cleanupSystemDarkModeListener()
  })

  return {
    systemDarkMode,
  }
}
