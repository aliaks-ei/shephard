/**
 * Validates if a value exists (is not empty)
 * @param val - The value to check
 * @param message - Optional custom error message
 * @returns true if valid, error message if invalid
 */
export function required(
  val: string | number,
  message = 'This field is required',
): boolean | string {
  return !!val || message;
}

/**
 * Validates if a string is a valid email format
 * @param val - The email string to validate
 * @param message - Optional custom error message
 * @returns true if valid, error message if invalid
 */
export function email(val: string, message = 'Please enter a valid email'): boolean | string {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(val) || message;
}

/**
 * Returns an array of validation rules for email fields
 * @returns Array of validation functions for email fields
 */
export function emailRules(): Array<(val: string) => boolean | string> {
  return [(val: string) => required(val), (val: string) => email(val)];
}
