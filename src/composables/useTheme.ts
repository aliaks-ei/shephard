import { Dark } from 'quasar'
import { watch, ref, computed, type Ref } from 'vue'
import type { ThemePreference } from 'src/api/user'

export type ThemeAdapter = {
  setDarkMode: (isDark: boolean) => void
}

export const QuasarThemeAdapter: ThemeAdapter = {
  setDarkMode: (isDark: boolean) => {
    Dark.set(isDark)
  },
}

export function useTheme(
  themePreference: Ref<ThemePreference>,
  options?: {
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
      }

      systemDarkModeListener.addEventListener('change', handleSystemDarkModeChange)
    }
  }

  const isDark = computed(() => {
    if (themePreference.value === 'system') {
      return systemDarkMode.value
    }
    return themePreference.value === 'dark'
  })

  watch(
    isDark,
    () => {
      adapter.setDarkMode(isDark.value)
    },
    { immediate: true },
  )

  setupSystemDarkModeListener()

  return {
    systemDarkMode,
    isDark,
  }
}
