import { describe, it, expect } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { getUserDisplayName, getUserInitial } from './name'

describe('getUserDisplayName', () => {
  it('returns empty string for null/undefined user', () => {
    expect(getUserDisplayName(null, null)).toBe('')
    expect(getUserDisplayName(undefined, undefined)).toBe('')
  })

  it('returns full_name from user_metadata when available', () => {
    const user = {
      user_metadata: { full_name: 'John Doe' },
    } as unknown as User

    expect(getUserDisplayName(user.user_metadata?.full_name, user.email)).toBe('John Doe')
  })

  it('returns name from user_metadata when full_name is not available', () => {
    const user = {
      user_metadata: { name: 'John Doe' },
      email: 'john.doe@example.com',
    } as unknown as User

    expect(getUserDisplayName(user.user_metadata?.name, user.email)).toBe('John Doe')
  })

  it('returns email username when no full_name or name is available', () => {
    const user = {
      email: 'john.doe@example.com',
      user_metadata: {},
    } as unknown as User

    expect(getUserDisplayName(user.user_metadata?.name, user.email)).toBe('john.doe')
  })

  it('returns full email when no @ is present', () => {
    const user = {
      email: 'invalid-email',
      user_metadata: {},
    } as unknown as User

    expect(getUserDisplayName(user.user_metadata?.name, user.email)).toBe('invalid-email')
  })

  it('returns empty string when no user_metadata or email is available', () => {
    const user = {} as unknown as User
    expect(getUserDisplayName(user.user_metadata?.name, user.email)).toBe('')
  })
})

describe('getUserInitial', () => {
  it('returns uppercase first letter of email', () => {
    expect(getUserInitial('john.doe@example.com')).toBe('J')
  })

  it('returns ? when email is undefined', () => {
    expect(getUserInitial(undefined)).toBe('?')
  })

  it('returns ? when email is empty string', () => {
    expect(getUserInitial('')).toBe('?')
  })
})
