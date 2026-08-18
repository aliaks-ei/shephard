import { describe, expect, it } from 'vitest'
import { toolResult } from '../src/tools.js'

describe('toolResult', () => {
  it('wraps list results in an object for the MCP structured-content contract', () => {
    const plans = [{ id: 'plan-1', name: 'August' }]

    expect(toolResult(plans)).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(plans) }],
      structuredContent: { items: plans },
    })
  })

  it('preserves object results as structured content', () => {
    const overview = { id: 'plan-1', total: 150 }

    expect(toolResult(overview).structuredContent).toEqual(overview)
  })
})
