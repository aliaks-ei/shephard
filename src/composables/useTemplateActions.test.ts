import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useTemplateActions, type TemplateActionsContext } from './useTemplateActions'

function createContext(overrides: Partial<TemplateActionsContext> = {}): TemplateActionsContext {
  return {
    isNewTemplate: ref(false),
    isOwner: ref(true),
    isEditMode: ref(true),
    handlers: {
      onAddCategory: vi.fn(),
      onSave: vi.fn(),
      onShare: vi.fn(),
      onDelete: vi.fn(),
      onExport: vi.fn(),
    },
    ...overrides,
  }
}

describe('useTemplateActions', () => {
  it('shows sharing for an owner', () => {
    const { actionBarActions } = useTemplateActions(createContext())

    expect(actionBarActions.value.find((action) => action.key === 'share')?.visible).toBe(true)
  })

  it('hides sharing for a collaborator with edit access', () => {
    const { actionBarActions } = useTemplateActions(
      createContext({
        isOwner: ref(false),
        isEditMode: ref(true),
      }),
    )

    expect(actionBarActions.value.find((action) => action.key === 'share')?.visible).toBe(false)
  })
})
