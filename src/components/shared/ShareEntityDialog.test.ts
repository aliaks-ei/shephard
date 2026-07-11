import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ShareEntityDialog from './ShareEntityDialog.vue'

const mutateUnshare = vi.fn()
const emitNotificationEvent = vi.fn()

vi.mock('src/queries/sharing', () => ({
  useSharedUsersQuery: () => ({
    data: ref([]),
    isFetching: ref(false),
  }),
  useShareEntityMutation: () => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  }),
  useUnshareEntityMutation: () => ({
    mutateAsync: mutateUnshare,
  }),
  useUpdatePermissionMutation: () => ({
    mutateAsync: vi.fn(),
  }),
  useSearchUsersQuery: () => ({
    data: ref([]),
    isFetching: ref(false),
  }),
}))

vi.mock('src/stores/user', () => ({
  useUserStore: () => ({
    userProfile: { id: 'owner-1' },
  }),
}))

vi.mock('src/composables/useNotificationEvents', () => ({
  useNotificationEvents: () => ({
    emitNotificationEvent,
  }),
}))

function createWrapper() {
  return mount(ShareEntityDialog, {
    props: {
      entityId: 'plan-1',
      entityType: 'plan',
      entityName: 'Summer plan',
      ownerUserId: 'owner-1',
      modelValue: true,
    },
    global: {
      stubs: {
        ShareDialog: {
          template:
            "<button class=\"remove-access\" @click=\"$emit('remove-user-access', 'plan-1', 'user-2')\" />",
          emits: ['remove-user-access'],
        },
      },
    },
  })
}

describe('ShareEntityDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateUnshare.mockResolvedValue(undefined)
    emitNotificationEvent.mockResolvedValue(undefined)
  })

  it('revokes access before emitting the removal notification', async () => {
    const wrapper = createWrapper()

    await wrapper.find('.remove-access').trigger('click')
    await vi.waitFor(() => {
      expect(emitNotificationEvent).toHaveBeenCalledOnce()
    })

    expect(mutateUnshare).toHaveBeenCalledWith({
      entityId: 'plan-1',
      userId: 'user-2',
    })
    expect(mutateUnshare.mock.invocationCallOrder[0]!).toBeLessThan(
      emitNotificationEvent.mock.invocationCallOrder[0]!,
    )
  })
})
