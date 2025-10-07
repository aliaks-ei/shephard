import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestingPinia } from '@pinia/testing'
import { useNotificationStore } from './notification'
import { Notify } from 'quasar'
import type { NotificationItem } from './notification'

vi.mock('quasar', () => ({
  Notify: {
    create: vi.fn(),
  },
}))

describe('Notification Store', () => {
  let notificationStore: ReturnType<typeof useNotificationStore>

  beforeEach(() => {
    vi.clearAllMocks()

    createTestingPinia({
      createSpy: vi.fn,
      stubActions: false,
      initialState: {
        notification: {
          notifications: [],
        },
      },
    })

    notificationStore = useNotificationStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(notificationStore.notifications).toEqual([])
    })
  })

  describe('showNotification()', () => {
    it('should add notification to the store', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)
      const now = new Date()
      vi.useFakeTimers()
      vi.setSystemTime(now)

      const id = notificationStore.showNotification('Test message', 'info')

      expect(id).toBe(mockUuid)
      expect(notificationStore.notifications).toHaveLength(1)
      expect(notificationStore.notifications[0]?.id).toBe(mockUuid)
      expect(notificationStore.notifications[0]).toEqual({
        id: mockUuid,
        type: 'info',
        message: 'Test message',
        timestamp: now,
      })
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'info',
        icon: 'eva-info-outline',
        timeout: 3000,
        message: 'Test message',
      })

      vi.useRealTimers()
    })

    it('should add notification with custom options', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      notificationStore.showNotification('Custom message', 'warning', {
        timeout: 1000,
        position: 'top',
        group: 'test-group',
      })

      expect(notificationStore.notifications[0]?.group).toBe('test-group')
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'warning',
        icon: 'eva-alert-triangle-outline',
        timeout: 1000,
        message: 'Custom message',
        position: 'top',
        group: 'test-group',
        actions: [
          {
            icon: 'eva-close-outline',
            color: 'white',
            round: true,
            dense: true,
            size: 'sm',
            handler: expect.any(Function),
          },
        ],
      })
    })

    it('should limit notifications to 20 items', () => {
      vi.spyOn(notificationStore.notifications, 'unshift').mockImplementation(function (
        this: NotificationItem[],
        ...items: NotificationItem[]
      ) {
        Array.prototype.unshift.apply(this, items)
        return this.length
      })

      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      for (let i = 0; i < 25; i++) {
        notificationStore.showNotification(`Message ${i}`)
      }

      expect(notificationStore.notifications).toHaveLength(20)
      expect(notificationStore.notifications[0]?.message).toBe('Message 24')
      expect(notificationStore.notifications[19]?.message).toBe('Message 5')
    })
  })

  describe('showInfo()', () => {
    it('should show info notification', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      const id = notificationStore.showInfo('Info message')

      expect(id).toBe(mockUuid)
      expect(notificationStore.notifications[0]?.type).toBe('info')
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'info',
        icon: 'eva-info-outline',
        timeout: 3000,
        message: 'Info message',
      })
    })
  })

  describe('showSuccess()', () => {
    it('should show success notification', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      const id = notificationStore.showSuccess('Success message')

      expect(id).toBe(mockUuid)
      expect(notificationStore.notifications[0]?.type).toBe('positive')
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'positive',
        icon: 'eva-checkmark-circle-outline',
        timeout: 3000,
        message: 'Success message',
      })
    })
  })

  describe('showError()', () => {
    it('should show error notification', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      const id = notificationStore.showError('Error message')

      expect(id).toBe(mockUuid)
      expect(notificationStore.notifications[0]?.type).toBe('negative')
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'negative',
        icon: 'eva-alert-triangle-outline',
        timeout: 5000,
        message: 'Error message',
        actions: [
          {
            icon: 'eva-close-outline',
            color: 'white',
            round: true,
            dense: true,
            size: 'sm',
            handler: expect.any(Function),
          },
        ],
      })
    })
  })

  describe('showWarning()', () => {
    it('should show warning notification', () => {
      const mockUuid = '123e4567-e89b-12d3-a456-426614174000'
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUuid)

      const id = notificationStore.showWarning('Warning message')

      expect(id).toBe(mockUuid)
      expect(notificationStore.notifications[0]?.type).toBe('warning')
      expect(Notify.create).toHaveBeenCalledWith({
        type: 'warning',
        icon: 'eva-alert-triangle-outline',
        timeout: 4000,
        message: 'Warning message',
        actions: [
          {
            icon: 'eva-close-outline',
            color: 'white',
            round: true,
            dense: true,
            size: 'sm',
            handler: expect.any(Function),
          },
        ],
      })
    })
  })
})
