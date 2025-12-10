/**
 * Normalizes a decimal input string to use dot as decimal separator.
 * Supports both comma (European format) and dot (US format) as decimal separators.
 *
 * @param value - The input value (string, number, null, or undefined)
 * @returns The normalized numeric value, or null if the input is empty/invalid
 */
export function parseDecimalInput(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return isNaN(value) ? null : value
  }

  // Normalize comma to dot for decimal separator
  const normalizedValue = value.replace(',', '.')
  const parsedValue = parseFloat(normalizedValue)

  return isNaN(parsedValue) ? null : parsedValue
}

/**
 * Checks if a string represents a valid decimal number.
 * Supports both comma and dot as decimal separators.
 *
 * @param value - The input value to validate
 * @returns True if the value is a valid decimal number
 */
export function isValidDecimalInput(value: string | number | null | undefined): boolean {
  const parsed = parseDecimalInput(value)
  return parsed !== null
}
