import { useError } from 'src/composables/useError'
import {
  emitNotificationEvent as emitNotificationEventRequest,
  type EmitNotificationEventInput,
} from 'src/api/notifications'
import type { NotificationEntityType } from 'src/types/notifications'

type EmitOptions = {
  swallowErrors?: boolean
}

export function useNotificationEvents() {
  const { handleError } = useError()

  async function emitNotificationEvent(
    input: EmitNotificationEventInput,
    options: EmitOptions = {},
  ): Promise<boolean> {
    const { swallowErrors = true } = options

    try {
      await emitNotificationEventRequest(input)
      return true
    } catch (error) {
      if (swallowErrors) {
        handleError('NOTIFICATIONS.EMIT_FAILED', error)
        return false
      }

      throw error
    }
  }

  async function emitRemovalNotification(
    entityType: NotificationEntityType,
    entityId: string,
    entityName: string | undefined,
    getSharedUsers: () => Promise<{ user_id: string }[]>,
  ): Promise<void> {
    const sharedUsers = await getSharedUsers()
    if (sharedUsers.length === 0) return

    await emitNotificationEvent(
      {
        type: entityType === 'plan' ? 'shared_plan_removed' : 'shared_template_removed',
        entityType,
        entityId,
        entityName,
        targetUserIds: sharedUsers.map((user) => user.user_id),
      },
      { swallowErrors: false },
    )
  }

  return {
    emitNotificationEvent,
    emitRemovalNotification,
  }
}
