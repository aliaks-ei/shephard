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
  | 'USER.PREFERENCE_UPDATE_FAILED'
  | 'USER.CREATE_FAILED'
  | 'USER.INIT_FAILED'
  | 'USER.DARK_MODE_TOGGLE_FAILED'
  | 'USER.PUSH_NOTIFICATIONS_UPDATE_FAILED'
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
    message: 'Unable to initialize authentication',
    notify: true,
    log: true,
  },
  'AUTH.GOOGLE_SIGNIN_FAILED': {
    message: 'Google sign-in was unsuccessful',
    notify: true,
    log: true,
  },
  'AUTH.GOOGLE_SIGNIN_NO_NONCE': {
    message: 'Authentication security check failed',
    notify: true,
    log: true,
  },
  'AUTH.OTP_SEND_FAILED': {
    message: 'Unable to send login code to your email',
    notify: true,
    log: true,
  },
  'AUTH.OTP_VERIFY_FAILED': {
    message: 'The login code you entered is invalid or expired',
    notify: true,
    log: true,
  },
  'AUTH.SIGNOUT_FAILED': {
    message: 'Unable to sign out',
    notify: true,
    log: true,
  },
  'AUTH.PROFILE_UPDATE_FAILED': {
    message: 'Unable to update your profile',
    notify: true,
    log: true,
  },
  'AUTH.NOT_AUTHENTICATED': {
    message: 'You must be signed in to perform this action',
    notify: true,
    log: true,
  },

  // User errors
  'USER.GET_FAILED': {
    message: 'Unable to retrieve your user information',
    throw: true,
    notify: true,
    log: true,
  },
  'USER.PREFERENCES_LOAD_FAILED': {
    message: 'Unable to load your preferences',
    throw: true,
    notify: true,
    log: true,
  },
  'USER.PREFERENCES_SAVE_FAILED': {
    message: 'Unable to save your preferences',
    throw: true,
    notify: true,
    log: true,
  },
  'USER.PREFERENCE_UPDATE_FAILED': {
    message: 'Unable to save preference',
    withEntityName: true, // Will add the preference name
    throw: true,
    notify: true,
    log: true,
  },
  'USER.CREATE_FAILED': {
    message: 'Unable to create user account',
    throw: true,
    notify: true,
    log: true,
  },
  'USER.INIT_FAILED': {
    message: 'Unable to initialize user data',
    notify: true,
    log: true,
  },
  'USER.DARK_MODE_TOGGLE_FAILED': {
    message: 'Unable to toggle dark mode',
    notify: true,
    log: true,
  },
  'USER.PUSH_NOTIFICATIONS_UPDATE_FAILED': {
    message: 'Unable to update notification settings',
    notify: true,
    log: true,
  },
  'USER.EMAIL_RESET_FAILED': {
    message: 'Unable to reset email state',
    notify: true,
    log: true,
  },

  // Default error
  UNKNOWN: {
    message: 'An unexpected error occurred',
    includeErrorMessage: true,
    notify: true,
    log: true,
  },
}
