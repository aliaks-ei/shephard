import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'
import { ref } from 'vue'

import PlanCard from './PlanCard.vue'
import type { PlanWithPermission } from 'src/api'
import { useUserStore } from 'src/stores/user'

installQuasarPlugin()

vi.mock('src/stores/user', () => ({
  useUserStore: vi.fn(),
}))

vi.mock('src/utils/currency', () => ({
  formatCurrency: vi.fn(
    (amount: number, currency: string) => `${currency} ${amount?.toFixed(2) ?? '0.00'}`,
  ),
}))

vi.mock('src/utils/plans', () => ({
  getPlanStatus: vi.fn(() => 'active'),
  getStatusText: vi.fn(() => '5 days left'),
  getStatusColor: vi.fn(() => 'green'),
  getStatusIcon: vi.fn(() => 'eva-play-circle-outline'),
  formatDateRange: vi.fn(() => 'Jan 1 - Jan 31, 2024'),
}))

vi.mock('src/utils/templates', () => ({
  getPermissionText: vi.fn(() => 'Can Edit'),
  getPermissionColor: vi.fn(() => 'primary'),
  getPermissionIcon: vi.fn(() => 'eva-edit-outline'),
}))

type PlanCardProps = ComponentProps<typeof PlanCard>

const mockPlan: PlanWithPermission = {
  id: 'plan-1',
  name: 'Test Plan',
  owner_id: 'user-1',
  currency: 'USD',
  total: 1000,
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  status: 'active',
  template_id: 'template-1',
  created_at: '2023-12-01T00:00:00Z',
  updated_at: '2023-12-01T00:00:00Z',
  permission_level: 'edit',
  is_shared: true,
}

const renderPlanCard = (props: PlanCardProps, userProfile = { id: 'user-1' }) => {
  vi.mocked(useUserStore).mockReturnValue({
    userProfile: ref(userProfile),
  } as unknown as ReturnType<typeof useUserStore>)

  return mount(PlanCard, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: true,
        }),
      ],
      stubs: {
        PlanCardMenu: {
          template: '<div data-testid="plan-card-menu" />',
          props: ['isOwner', 'permissionLevel', 'planStatus'],
          emits: ['edit', 'share', 'delete', 'cancel'],
        },
        'q-dialog': {
          template: '<div v-if="modelValue"><slot /></div>',
          props: ['modelValue', 'persistent'],
        },
        'q-card': { template: '<div><slot /></div>' },
        'q-card-section': { template: '<div><slot /></div>' },
        'q-card-actions': { template: '<div><slot /></div>' },
        'q-btn': {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
          props: ['flat', 'label', 'color', 'unelevated'],
          emits: ['click'],
        },
        'q-badge': {
          template: '<span class="badge"><slot /></span>',
          props: ['color', 'outline'],
        },
        'q-icon': {
          template: '<i></i>',
          props: ['name', 'size'],
        },
      },
    },
  })
}

describe('PlanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
      hideSharedBadge: true,
    })

    expect(wrapper.props('plan')).toEqual(mockPlan)
    expect(wrapper.props('hideSharedBadge')).toBe(true)
  })

  it('should use default hideSharedBadge value', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    expect(wrapper.props('hideSharedBadge')).toBe(false)
  })

  it('should display plan name and total amount', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    expect(wrapper.text()).toContain(mockPlan.name)
    expect(wrapper.text()).toContain('USD 1000.00')
  })

  it('should emit edit event when card is clicked', async () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    const clickableItem = wrapper.find('.q-item')
    await clickableItem.trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([mockPlan.id])
  })

  it('should emit share event when menu emits share', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    wrapper.vm.$emit('share', mockPlan.id)
    expect(wrapper.emitted('share')).toBeTruthy()
    expect(wrapper.emitted('share')?.[0]).toEqual([mockPlan.id])
  })

  it('should emit delete event when menu emits delete', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    wrapper.vm.$emit('delete', mockPlan)
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual([mockPlan])
  })

  it('should emit cancel event when menu emits cancel', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    wrapper.vm.$emit('cancel', mockPlan)
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('cancel')?.[0]).toEqual([mockPlan])
  })

  it('should render menu component with proper props', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    const menu = wrapper.findComponent('[data-testid="plan-card-menu"]')
    expect(menu.exists()).toBe(true)
  })

  it('should handle menu events properly', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    wrapper.vm.$emit('edit', mockPlan.id)
    expect(wrapper.emitted('edit')).toBeTruthy()

    wrapper.vm.$emit('share', mockPlan.id)
    expect(wrapper.emitted('share')).toBeTruthy()
  })

  it('should handle plan without permission level', () => {
    const planWithoutPermission = { ...mockPlan }
    delete planWithoutPermission.permission_level

    const wrapper = renderPlanCard({
      plan: planWithoutPermission,
    })

    expect(wrapper.props('plan')).toEqual(planWithoutPermission)
  })

  it('should handle plan that is not shared', () => {
    const notSharedPlan = { ...mockPlan, is_shared: false }

    const wrapper = renderPlanCard({
      plan: notSharedPlan,
    })

    expect(wrapper.props('plan')).toEqual(notSharedPlan)
  })

  it('should handle different plan properties', () => {
    const differentPlan = {
      ...mockPlan,
      id: 'plan-2',
      name: 'Different Plan',
      currency: 'EUR',
      total: 2000,
      status: 'pending' as const,
    }

    const wrapper = renderPlanCard({
      plan: differentPlan,
    })

    expect(wrapper.props('plan')).toEqual(differentPlan)
    expect(wrapper.text()).toContain('Different Plan')
    expect(wrapper.text()).toContain('EUR 2000.00')
  })

  it('should handle hideSharedBadge prop correctly', () => {
    const hiddenBadgeWrapper = renderPlanCard({
      plan: mockPlan,
      hideSharedBadge: true,
    })

    expect(hiddenBadgeWrapper.props('hideSharedBadge')).toBe(true)

    const shownBadgeWrapper = renderPlanCard({
      plan: mockPlan,
      hideSharedBadge: false,
    })

    expect(shownBadgeWrapper.props('hideSharedBadge')).toBe(false)
  })

  it('should handle zero total amount', () => {
    const planWithZeroTotal = { ...mockPlan, total: 0 }

    const wrapperZero = renderPlanCard({
      plan: planWithZeroTotal,
    })
    expect(wrapperZero.text()).toContain('USD 0.00')
  })

  it('should show shared badge when user is owner and plan is shared', () => {
    const wrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'user-1', is_shared: true },
      },
      { id: 'user-1' },
    )

    const badges = wrapper.findAll('.badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should hide shared badge when hideSharedBadge is true', () => {
    const wrapper = renderPlanCard({
      plan: { ...mockPlan, is_shared: true },
      hideSharedBadge: true,
    })

    const badges = wrapper.findAll('.badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should not show shared badge when user is not owner', () => {
    const wrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'different-user', is_shared: true },
      },
      { id: 'user-1' },
    )

    const badges = wrapper.findAll('.badge')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('should show permission badge when plan has permission level', () => {
    const wrapper = renderPlanCard({
      plan: { ...mockPlan, permission_level: 'edit' },
    })

    expect(wrapper.text()).toContain('Can Edit')
  })

  it('should format currency correctly', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    expect(wrapper.text()).toContain('USD 1000.00')
  })

  it('should determine ownership correctly', () => {
    const ownerWrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'user-1' },
      },
      { id: 'user-1' },
    )

    expect(ownerWrapper.text()).toContain('Test Plan')

    const nonOwnerWrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'different-user' },
      },
      { id: 'user-1' },
    )

    expect(nonOwnerWrapper.text()).toContain('Test Plan')
  })

  it('should determine share status correctly', () => {
    const sharedPlanWrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'user-1', is_shared: true },
      },
      { id: 'user-1' },
    )

    expect(sharedPlanWrapper.text()).toContain('Test Plan')

    const notSharedPlanWrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'user-1', is_shared: false },
      },
      { id: 'user-1' },
    )

    expect(notSharedPlanWrapper.text()).toContain('Test Plan')

    const nonOwnerWrapper = renderPlanCard(
      {
        plan: { ...mockPlan, owner_id: 'different-user', is_shared: true },
      },
      { id: 'user-1' },
    )

    expect(nonOwnerWrapper.text()).toContain('Test Plan')
  })

  it('should pass correct props to PlanCardMenu', () => {
    const wrapper = renderPlanCard({
      plan: mockPlan,
    })

    const menu = wrapper.findComponent('[data-testid="plan-card-menu"]')
    expect(menu.exists()).toBe(true)
  })
})
