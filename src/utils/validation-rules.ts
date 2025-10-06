export function required(
  val: string | number,
  message = 'This field is required',
): boolean | string {
  return !!val || message
}

export function email(val: string, message = 'Please enter a valid email'): boolean | string {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  return emailRegex.test(val) || message
}

export function emailRules(): Array<(val: string) => boolean | string> {
  return [(val: string) => required(val), (val: string) => email(val)]
}
