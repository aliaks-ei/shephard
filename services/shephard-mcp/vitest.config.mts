import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['services/shephard-mcp/tests/**/*.test.ts'],
  },
})
