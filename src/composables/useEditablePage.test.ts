import { describe, it, expect } from 'vitest'
import { useEditablePage } from './useEditablePage'

describe('useEditablePage', () => {
  it('has empty dialog states by default', () => {
    const { getDialogState } = useEditablePage()
    expect(getDialogState('test')).toBe(false)
  })

  it('opens dialog', () => {
    const { openDialog, getDialogState } = useEditablePage()

    openDialog('test')
    expect(getDialogState('test')).toBe(true)
  })

  it('closes dialog', () => {
    const { openDialog, closeDialog, getDialogState } = useEditablePage()

    openDialog('test')
    expect(getDialogState('test')).toBe(true)

    closeDialog('test')
    expect(getDialogState('test')).toBe(false)
  })

  it('returns false for non-existent dialog state', () => {
    const { getDialogState } = useEditablePage()
    expect(getDialogState('non-existent')).toBe(false)
  })

  it('can manage multiple dialogs independently', () => {
    const { openDialog, closeDialog, getDialogState } = useEditablePage()

    openDialog('dialog1')
    openDialog('dialog2')

    expect(getDialogState('dialog1')).toBe(true)
    expect(getDialogState('dialog2')).toBe(true)

    closeDialog('dialog1')

    expect(getDialogState('dialog1')).toBe(false)
    expect(getDialogState('dialog2')).toBe(true)
  })
})
