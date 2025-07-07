export const getPermissionText = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'view only'
    case 'edit':
      return 'can edit'
    default:
      return 'unknown'
  }
}

export const getPermissionColor = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'warning'
    case 'edit':
      return 'positive'
    default:
      return 'grey'
  }
}

export const getPermissionIcon = (permission: string): string => {
  switch (permission) {
    case 'view':
      return 'eva-eye-outline'
    case 'edit':
      return 'eva-edit-outline'
    default:
      return 'eva-question-mark-outline'
  }
}
