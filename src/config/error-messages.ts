export type ErrorMessageKey =
  | 'AUTH.INIT_FAILED'
  | 'AUTH.GOOGLE_SIGNIN_FAILED'
  | 'AUTH.GOOGLE_SIGNIN_NO_NONCE'
  | 'AUTH.OTP_SEND_FAILED'
  | 'AUTH.OTP_VERIFY_FAILED'
  | 'AUTH.SIGNOUT_FAILED'
  | 'AUTH.PROFILE_UPDATE_FAILED'
  | 'AUTH.NOT_AUTHENTICATED'
  | 'USER.GET_FAILED'
  | 'USER.PREFERENCES_LOAD_FAILED'
  | 'USER.PREFERENCES_SAVE_FAILED'
  | 'USER.CREATE_FAILED'
  | 'USER.INIT_FAILED'
  | 'USER.EMAIL_RESET_FAILED'
  | 'UNKNOWN'

interface ErrorMessageConfig {
  message: string
  withEntityName?: boolean
  includeErrorMessage?: boolean
  notify?: boolean
  log?: boolean
  throw?: boolean
}

export const ERROR_MESSAGES: Record<ErrorMessageKey, ErrorMessageConfig> = {
  // Authentication errors
  'AUTH.INIT_FAILED': {
    message: "We couldn't start the sign-in process. Please try again or check your connection.",
    notify: true,
    log: true,
  },
  'AUTH.GOOGLE_SIGNIN_FAILED': {
    message: "We couldn't sign you in with Google. Please try again or use a different method.",
    notify: true,
    log: true,
  },
  'AUTH.GOOGLE_SIGNIN_NO_NONCE': {
    message:
      "Something didn't match during sign-in. Please try again or contact support if the issue continues.",
    notify: true,
    log: true,
  },
  'AUTH.OTP_SEND_FAILED': {
    message:
      "We couldn't send the login code. Please check your email address or try again shortly.",
    notify: true,
    log: true,
  },
  'AUTH.OTP_VERIFY_FAILED': {
    message: "That code doesn't work or has expired. Please request a new one.",
    notify: true,
    log: true,
  },
  'AUTH.SIGNOUT_FAILED': {
    message: "We couldn't log you out. Please refresh the page or try again.",
    notify: true,
    log: true,
  },
  'AUTH.PROFILE_UPDATE_FAILED': {
    message: "We couldn't save your changes. Please try again.",
    notify: true,
    log: true,
  },
  'AUTH.NOT_AUTHENTICATED': {
    message: 'Please sign in to continue.',
    notify: true,
    log: true,
  },

  // Account errors
  'USER.GET_FAILED': {
    message: "We couldn't load your account details. Please refresh or try again later.",
    throw: true,
    notify: true,
    log: true,
  },
  'USER.PREFERENCES_LOAD_FAILED': {
    message: "We couldn't load your settings. Please try again or check your connection.",
    throw: true,
    notify: true,
    log: true,
  },
  'USER.PREFERENCES_SAVE_FAILED': {
    message: "We couldn't save your settings. Please try again.",
    throw: true,
    notify: true,
    log: true,
  },
  'USER.CREATE_FAILED': {
    message: "We couldn't create your account. Please check your info and try again.",
    throw: true,
    notify: true,
    log: true,
  },
  'USER.INIT_FAILED': {
    message: 'We had trouble setting up your account. Please try again or contact support.',
    notify: true,
    log: true,
  },
  'USER.EMAIL_RESET_FAILED': {
    message: 'Something went wrong while resetting your email settings. Please try again.',
    notify: true,
    log: true,
  },

  // Default error
  UNKNOWN: {
    message: 'Something went wrong. Please try again or contact support if it continues.',
    includeErrorMessage: true,
    notify: true,
    log: true,
  },
}
