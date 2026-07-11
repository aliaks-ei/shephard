import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useInstallPromptGate } from './useInstallPromptGate'

const STORAGE_KEY = 'shephard-has-saved-expense'

describe('useInstallPromptGate', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('defaults to no saved expense', () => {
    const { hasSavedExpense } = useInstallPromptGate()
    expect(hasSavedExpense.value).toBe(false)
  })

  it('marks the expense as saved and persists the flag', async () => {
    const { hasSavedExpense, markExpenseSaved } = useInstallPromptGate()

    markExpenseSaved()
    await nextTick()

    expect(hasSavedExpense.value).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
  })

  it('restores the persisted flag for new consumers', () => {
    localStorage.setItem(STORAGE_KEY, 'true')

    const { hasSavedExpense } = useInstallPromptGate()
    expect(hasSavedExpense.value).toBe(true)
  })

  it('allows one install promotion per session after an expense is saved', async () => {
    const { canShowInstallPrompt, markExpenseSaved, markInstallPromptShown } =
      useInstallPromptGate()

    expect(canShowInstallPrompt.value).toBe(false)

    markExpenseSaved()
    await nextTick()
    expect(canShowInstallPrompt.value).toBe(true)

    markInstallPromptShown()
    await nextTick()
    expect(canShowInstallPrompt.value).toBe(false)
    expect(sessionStorage.getItem('shephard-install-prompt-shown')).toBe('true')
  })

  it('restores the per-session promotion marker for new consumers', () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    sessionStorage.setItem('shephard-install-prompt-shown', 'true')

    const { canShowInstallPrompt, hasShownInstallPromptThisSession } = useInstallPromptGate()

    expect(hasShownInstallPromptThisSession.value).toBe(true)
    expect(canShowInstallPrompt.value).toBe(false)
  })
})
