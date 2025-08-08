import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useEditablePage } from './useEditablePage'

describe('initial state', () => {
  it('has closed fab and not loading by default', () => {
    const { fabOpen, isLoading } = useEditablePage()
    expect(fabOpen.value).toBe(false)
    expect(isLoading.value).toBe(false)
  })
})

describe('dialog management', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('opens dialog and closes fab', () => {
    const { fabOpen, openDialog, getDialogState } = useEditablePage()

    openDialog('share')
    expect(fabOpen.value).toBe(false)
    expect(getDialogState('share')).toBe(true)
  })

  it('closes dialog', () => {
    const { openDialog, closeDialog, getDialogState } = useEditablePage()

    openDialog('rename')
    expect(getDialogState('rename')).toBe(true)
    closeDialog('rename')
    expect(getDialogState('rename')).toBe(false)
  })

  it('getDialogState returns false for unknown dialog', () => {
    const { getDialogState } = useEditablePage()
    expect(getDialogState('nonexistent')).toBe(false)
  })
})

describe('fab actions', () => {
  it('createFabAction closes fab and runs action', async () => {
    const { fabOpen, createFabAction } = useEditablePage()
    fabOpen.value = true

    const action = vi.fn().mockResolvedValue(undefined)
    const wrapped = createFabAction(action)

    await wrapped()

    expect(fabOpen.value).toBe(false)
    expect(action).toHaveBeenCalled()
  })
})

describe('initializeFab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('opens fab after nextTick and delay', async () => {
    const { fabOpen, initializeFab } = useEditablePage()

    expect(fabOpen.value).toBe(false)
    const promise = initializeFab(200)

    await nextTick()
    expect(fabOpen.value).toBe(false)

    vi.advanceTimersByTime(200)
    await promise
    expect(fabOpen.value).toBe(true)
  })

  it('defaults delay to 300ms', async () => {
    const { fabOpen, initializeFab } = useEditablePage()
    const promise = initializeFab()
    await nextTick()
    vi.advanceTimersByTime(300)
    await promise
    expect(fabOpen.value).toBe(true)
  })
})
