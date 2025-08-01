import { describe, it, expect, vi } from 'vitest'
import { generateRandomColor } from './color'

describe('generateRandomColor', () => {
  it('should return a string starting with #', () => {
    const color = generateRandomColor()
    expect(color).toMatch(/^#/)
  })

  it('should return a 7-character string', () => {
    const color = generateRandomColor()
    expect(color).toHaveLength(7)
  })

  it('should return a valid hex color format', () => {
    const color = generateRandomColor()
    expect(color).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('should generate different colors on multiple calls', () => {
    const colors = Array.from({ length: 10 }, () => generateRandomColor())
    const uniqueColors = new Set(colors)
    expect(uniqueColors.size).toBeGreaterThan(1)
  })

  it('should use only valid hex characters', () => {
    const color = generateRandomColor()
    const hexPart = color.slice(1)
    const validHexChars = /^[0-9A-F]+$/
    expect(hexPart).toMatch(validHexChars)
  })

  it('should generate predictable output with mocked Math.random', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom.mockReturnValue(0)

    const color = generateRandomColor()
    expect(color).toBe('#000000')

    mockRandom.mockRestore()
  })

  it('should generate maximum value with mocked Math.random at 0.999', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom.mockReturnValue(0.999)

    const color = generateRandomColor()
    expect(color).toBe('#FFFFFF')

    mockRandom.mockRestore()
  })

  it('should handle edge case with alternating random values', () => {
    const mockRandom = vi.spyOn(Math, 'random')
    mockRandom
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.999)
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0.75)
      .mockReturnValueOnce(0.1)

    const color = generateRandomColor()
    expect(color).toBe('#0F84C1')

    mockRandom.mockRestore()
  })
})
