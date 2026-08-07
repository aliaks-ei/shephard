import { assertEquals } from 'jsr:@std/assert'
import { buildCorsHeaders } from './notification-utils.ts'

Deno.test('buildCorsHeaders allows the regional invocation header', () => {
  const headers = buildCorsHeaders('https://shephard.app')
  const allowedHeaders = headers['Access-Control-Allow-Headers']
    .split(',')
    .map((header) => header.trim())

  assertEquals(allowedHeaders.includes('x-region'), true)
})
