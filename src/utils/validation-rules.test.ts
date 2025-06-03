import { describe, it, expect } from 'vitest'
import { required, email, emailRules } from './validation-rules'

describe('required', () => {
  it('should return true for non-empty string', () => {
    expect(required('test')).toBe(true)
  })

  it('should return true for non-zero number', () => {
    expect(required(42)).toBe(true)
  })

  it('should return default error message for empty string', () => {
    expect(required('')).toBe('This field is required')
  })

  it('should return default error message for zero', () => {
    expect(required(0)).toBe('This field is required')
  })

  it('should return custom error message when provided', () => {
    expect(required('', 'Custom message')).toBe('Custom message')
  })
})

describe('email', () => {
  it('should return true for valid email', () => {
    expect(email('test@example.com')).toBe(true)
  })

  it('should return true for valid email with subdomain', () => {
    expect(email('test@sub.example.com')).toBe(true)
  })

  it('should return true for valid email with dot in name', () => {
    expect(email('test.name@example.com')).toBe(true)
  })

  it('should return true for valid email with hyphen in name', () => {
    expect(email('test-name@example.com')).toBe(true)
  })

  it('should return default error message for invalid email without @', () => {
    expect(email('testexample.com')).toBe('Please enter a valid email')
  })

  it('should return default error message for invalid email without domain', () => {
    expect(email('test@')).toBe('Please enter a valid email')
  })

  it('should return default error message for invalid email with incomplete domain', () => {
    expect(email('test@example')).toBe('Please enter a valid email')
  })

  it('should return custom error message when provided', () => {
    expect(email('invalid', 'Custom message')).toBe('Custom message')
  })
})

describe('emailRules', () => {
  it('should return an array of two validation functions', () => {
    const rules = emailRules()
    expect(rules).toHaveLength(2)
    expect(typeof rules[0]).toBe('function')
    expect(typeof rules[1]).toBe('function')
  })

  it('should return true for valid email when executing the rules', () => {
    const rules = emailRules()
    const validEmail = 'test@example.com'

    expect(rules[0]?.(validEmail)).toBe(true)
    expect(rules[1]?.(validEmail)).toBe(true)
  })

  it('should return error message for empty email when executing the rules', () => {
    const rules = emailRules()
    const emptyEmail = ''

    expect(rules[0]?.(emptyEmail)).toBe('This field is required')
  })

  it('should return error message for invalid email when executing the rules', () => {
    const rules = emailRules()
    const invalidEmail = 'invalid'

    expect(rules[0]?.(invalidEmail)).toBe(true)
    expect(rules[1]?.(invalidEmail)).toBe('Please enter a valid email')
  })
})
