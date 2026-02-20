import { mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ComponentProps } from 'vue-component-type-helpers'

import PlanCardMenu from './PlanCardMenu.vue'

installQuasarPlugin()

type PlanCardMenuProps = ComponentProps<typeof PlanCardMenu>

const renderPlanCardMenu = (props: PlanCardMenuProps) => {
  return mount(PlanCardMenu, {
    props,
    global: {
      stubs: {
        'q-menu': { template: '<div><slot /></div>' },
        'q-list': { template: '<div><slot /></div>' },
        'q-item': {
          template: '<div class="q-item" role="menuitem" @click="$emit(\'click\')"><slot /></div>',
        },
        'q-item-section': { template: '<div><slot /></div>' },
        'q-item-label': { template: '<div><slot /></div>' },
        'q-icon': { template: '<i />' },
      },
    },
  })
}

describe('PlanCardMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should mount component properly', () => {
    const wrapper = renderPlanCardMenu({
      canEdit: true,
      planStatus: 'active',
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('should have correct props interface', () => {
    const wrapper = renderPlanCardMenu({
      canEdit: false,
      permissionLevel: 'edit',
      planStatus: 'pending',
    })

    expect(wrapper.props('canEdit')).toBe(false)
    expect(wrapper.props('permissionLevel')).toBe('edit')
    expect(wrapper.props('planStatus')).toBe('pending')
  })

  it('should emit share when share item clicked', async () => {
    const wrapper = renderPlanCardMenu({ canEdit: true, planStatus: 'active' })
    const items = wrapper.findAll('.q-item')
    expect(items.length).toBeGreaterThan(0)
    await items[0]?.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
  })

  it('should show share and cancel for owner with active plan', async () => {
    const wrapper = renderPlanCardMenu({ canEdit: true, planStatus: 'active' })
    const items = wrapper.findAll('.q-item')
    expect(items.length).toBe(2)
    await items[0]?.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
    await items[1]?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('should show share and delete for owner with pending plan', async () => {
    const wrapper = renderPlanCardMenu({ canEdit: true, planStatus: 'pending' })
    const items = wrapper.findAll('.q-item')
    expect(items.length).toBe(2)
    await items[0]?.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
    await items[1]?.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('should show no items when canEdit is false', () => {
    const wrapper = renderPlanCardMenu({
      canEdit: false,
      permissionLevel: 'view',
      planStatus: 'completed',
    })
    expect(wrapper.findAll('.q-item').length).toBe(0)
  })

  it('should allow delete when plan is cancelled', async () => {
    const wrapper = renderPlanCardMenu({ canEdit: true, planStatus: 'cancelled' })
    const items = wrapper.findAll('.q-item')
    expect(items.length).toBe(2)
    await items[0]?.trigger('click')
    expect(wrapper.emitted('share')).toBeTruthy()
    await items[1]?.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })
})
