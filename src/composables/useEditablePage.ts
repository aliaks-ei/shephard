import { ref, nextTick } from 'vue'

export function useEditablePage() {
  const fabOpen = ref(false)
  const isLoading = ref(false)

  const dialogStates = ref<Record<string, boolean>>({})

  function openDialog(dialogName: string): void {
    fabOpen.value = false
    dialogStates.value[dialogName] = true
  }

  function closeDialog(dialogName: string): void {
    dialogStates.value[dialogName] = false
  }

  function getDialogState(dialogName: string): boolean {
    return dialogStates.value[dialogName] || false
  }

  function createFabAction(action: () => void | Promise<void>) {
    return async () => {
      fabOpen.value = false
      await action()
    }
  }

  async function initializeFab(delay: number = 300): Promise<void> {
    await nextTick()
    setTimeout(() => {
      fabOpen.value = true
    }, delay)
  }

  return {
    fabOpen,
    isLoading,
    openDialog,
    closeDialog,
    getDialogState,
    createFabAction,
    initializeFab,
  }
}
