import { ref } from 'vue'

export function useEditablePage() {
  const isLoading = ref(false)
  const dialogStates = ref<Record<string, boolean>>({})

  function openDialog(dialogName: string): void {
    dialogStates.value[dialogName] = true
  }

  function closeDialog(dialogName: string): void {
    dialogStates.value[dialogName] = false
  }

  function getDialogState(dialogName: string): boolean {
    return dialogStates.value[dialogName] || false
  }

  return {
    isLoading,
    openDialog,
    closeDialog,
    getDialogState,
  }
}
