import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useInstallPromptGate } from './useInstallPromptGate'

const STORAGE_KEY = 'shephard-has-saved-expense'

describe('useInstallPromptGate', () => {
  beforeEach(() => {
    localStorage.clear()
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
})
