import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { describe, it, expect } from 'vitest'

import NotificationInbox from './NotificationInbox.vue'
import type { NotificationRecord } from 'src/api/notifications'

installQuasarPlugin()

const unreadNotification: NotificationRecord = {
  id: 'notif-1',
  user_id: 'user-1',
  actor_user_id: 'user-2',
  type: 'template_shared',
  entity_type: 'template',
  entity_id: 'template-1',
  title: 'Jane Smith shared a template',
  body: 'Household Expenses is now available in your templates.',
  payload: {
    actorName: 'Jane Smith',
    entityName: 'Household Expenses',
    route: '/templates/template-1',
  },
  read_at: null,
  deleted_at: null,
  created_at: '2026-04-07T10:00:00.000Z',
  push_attempted_at: null,
  push_sent_at: null,
  push_error: null,
}

const readNotification: NotificationRecord = {
  ...unreadNotification,
  id: 'notif-2',
  type: 'shared_template_permission_changed',
  title: 'Template access updated',
  body: 'Jane Smith changed your Household Expenses access to edit.',
  read_at: '2026-04-07T08:30:00.000Z',
  created_at: '2026-04-07T08:00:00.000Z',
}

function renderInbox(props?: Partial<InstanceType<typeof NotificationInbox>['$props']>) {
  return mount(NotificationInbox, {
    props: {
      notifications: [unreadNotification, readNotification],
      unreadCount: 1,
      ...props,
    },
    global: {
      stubs: {
        RouterLink: {
          template: '<a><slot /></a>',
        },
        'router-link': {
          template: '<a><slot /></a>',
        },
        QMenu: {
          template: '<div class="notifications-actions-menu-stub"><slot /></div>',
        },
        QTooltip: true,
      },
    },
  })
}

describe('NotificationInbox', () => {
  it('renders grouped unread and earlier sections', () => {
    const wrapper = renderInbox()

    const sectionKeys = wrapper
      .findAll('[data-section-key]')
      .map((node) => node.attributes('data-section-key'))

    expect(sectionKeys).toEqual(['unread', 'earlier'])
    expect(wrapper.text()).toContain('Unread')
    expect(wrapper.text()).toContain('Earlier')
  })

  it('renders compact header actions without a footer settings row', () => {
    const wrapper = renderInbox()

    expect(wrapper.text()).toContain('Mark all read')
    expect(wrapper.text()).toContain('Delete all')
    expect(wrapper.find('button[aria-label="Notification settings"]').exists()).toBe(true)
  })

  it('renders the desktop mark-read control only for unread items', () => {
    const wrapper = renderInbox()

    expect(wrapper.findAll('button[aria-label="Mark notification as read"]')).toHaveLength(1)
    expect(wrapper.findAll('button[aria-label="Remove notification"]')).toHaveLength(2)
  })

  it('emits clear-all and mark-all-read from the overflow menu', async () => {
    const wrapper = renderInbox()
    const menuItems = wrapper.findAll('.notifications-actions-menu-stub .q-item')
    const markAllButton = menuItems.find((node) => node.text() === 'Mark all read')
    const clearAllButton = menuItems.find((node) => node.text() === 'Delete all')

    expect(markAllButton).toBeDefined()
    expect(clearAllButton).toBeDefined()

    await markAllButton!.trigger('click')
    await clearAllButton!.trigger('click')

    expect(wrapper.emitted('mark-all-read')).toHaveLength(1)
    expect(wrapper.emitted('clear-all')).toHaveLength(1)
  })

  it('renders the empty state', () => {
    const wrapper = renderInbox({
      notifications: [],
      unreadCount: 0,
    })

    expect(wrapper.text()).toContain('No notifications yet')
    expect(wrapper.text()).toContain(
      'Shared plans, templates, and access changes will appear here.',
    )
    expect(wrapper.find('button[aria-label="Notification settings"]').exists()).toBe(true)
  })

  it('does not render any mock-event control', () => {
    const wrapper = renderInbox()

    expect(wrapper.text()).not.toContain('Mock event')
  })

  it('renders the unread dot only for unread items', () => {
    const wrapper = renderInbox()
    const items = wrapper.findAll('[data-testid="notification-item"]')
    const unreadDots = wrapper.findAll('[data-testid="notification-unread-dot"]')

    expect(items).toHaveLength(2)
    expect(unreadDots).toHaveLength(1)
    expect(items[0]?.find('[data-testid="notification-unread-dot"]').exists()).toBe(true)
    expect(items[1]?.find('[data-testid="notification-unread-dot"]').exists()).toBe(false)
  })

  it('keeps compact icon actions on mobile without swipe controls', () => {
    const wrapper = renderInbox({
      mobile: true,
      showHeader: false,
    })

    expect(wrapper.html()).not.toContain('q-slide-item')
    expect(wrapper.findAll('button[aria-label="Mark notification as read"]')).toHaveLength(1)
    expect(wrapper.findAll('button[aria-label="Remove notification"]')).toHaveLength(2)
  })
})
