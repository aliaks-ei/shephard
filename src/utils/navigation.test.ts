import { describe, expect, it } from 'vitest'
import { sanitizeRedirectPath } from './navigation'

describe('sanitizeRedirectPath', () => {
  it('returns the fallback for non-string values', () => {
    expect(sanitizeRedirectPath(undefined)).toBe('/')
    expect(sanitizeRedirectPath(123)).toBe('/')
    expect(sanitizeRedirectPath({})).toBe('/')
  })

  it('keeps valid internal paths', () => {
    expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
    expect(sanitizeRedirectPath('/plans?id=123')).toBe('/plans?id=123')
  })

  it('returns the first value from arrays', () => {
    expect(sanitizeRedirectPath(['/dashboard', '/settings'])).toBe('/dashboard')
  })

  it('rejects protocol-relative and absolute urls', () => {
    expect(sanitizeRedirectPath('//evil.example.com')).toBe('/')
    expect(sanitizeRedirectPath('https://evil.example.com')).toBe('/')
  })

  it('rejects newline payloads', () => {
    expect(sanitizeRedirectPath('/home\nSet-Cookie: bad')).toBe('/')
  })

  it('supports custom fallback values', () => {
    expect(sanitizeRedirectPath('bad-path', '/plans')).toBe('/plans')
  })
})
