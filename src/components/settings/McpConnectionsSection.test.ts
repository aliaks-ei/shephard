import { flushPromises, mount } from '@vue/test-utils'
import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import McpConnectionsSection from './McpConnectionsSection.vue'

const mcpApi = vi.hoisted(() => ({
  getMcpAuthorizations: vi.fn(),
  revokeMcpAuthorization: vi.fn(),
  setMcpAuthorizationAccess: vi.fn(),
}))

vi.mock('src/api/mcp', () => mcpApi)

installQuasarPlugin()

describe('McpConnectionsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mcpApi.getMcpAuthorizations.mockResolvedValue([
      {
        client_id: 'chatgpt-client',
        access_level: 'read',
        created_at: '2026-08-18T00:00:00Z',
        updated_at: '2026-08-18T00:00:00Z',
      },
    ])
  })

  it('renders access controls from Shephard authorizations without OAuth grant metadata', async () => {
    const wrapper = mount(McpConnectionsSection)
    await flushPromises()

    expect(wrapper.text()).toContain('AI connection')
    expect(wrapper.text()).toContain('Read-only access')

    const toggle = wrapper.findComponent({ name: 'QToggle' })
    await toggle.vm.$emit('update:modelValue', true)

    expect(mcpApi.setMcpAuthorizationAccess).toHaveBeenCalledWith('chatgpt-client', 'write')
  })
})
