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
  | 'USERS.SEARCH_FAILED'
  | 'TEMPLATES.LOAD_FAILED'
  | 'TEMPLATES.LOAD_TEMPLATE_FAILED'
  | 'TEMPLATES.CREATE_FAILED'
  | 'TEMPLATES.UPDATE_FAILED'
  | 'TEMPLATES.DELETE_FAILED'
  | 'TEMPLATES.LOAD_SHARES_FAILED'
  | 'TEMPLATES.SHARE_FAILED'
  | 'TEMPLATES.UNSHARE_FAILED'
  | 'TEMPLATES.UPDATE_PERMISSION_FAILED'
  | 'TEMPLATES.DUPLICATE_NAME'
  | 'TEMPLATES.NAME_VALIDATION_FAILED'
  | 'CATEGORIES.LOAD_FAILED'
  | 'TEMPLATE_ITEMS.LOAD_FAILED'
  | 'TEMPLATE_ITEMS.CREATE_FAILED'
  | 'TEMPLATE_ITEMS.UPDATE_FAILED'
  | 'TEMPLATE_ITEMS.DELETE_FAILED'
  | 'TEMPLATE_ITEMS.VALIDATION_FAILED'
  | 'TEMPLATE_ITEMS.DUPLICATE_NAME_CATEGORY'
  | 'TEMPLATE_ITEMS.NAME_REQUIRED'
  | 'PLANS.LOAD_FAILED'
  | 'PLANS.LOAD_PLAN_FAILED'
  | 'PLANS.CREATE_FAILED'
  | 'PLANS.UPDATE_FAILED'
  | 'PLANS.DELETE_FAILED'
  | 'PLANS.CANCEL_FAILED'
  | 'PLANS.LOAD_SHARED_USERS_FAILED'
  | 'PLANS.SHARE_FAILED'
  | 'PLANS.UNSHARE_FAILED'
  | 'PLANS.UPDATE_PERMISSION_FAILED'
  | 'PLANS.DUPLICATE_NAME'
  | 'PLANS.USER_NOT_FOUND'
  | 'PLANS.ALREADY_SHARED'
  | 'PLANS.SEARCH_USERS_FAILED'
  | 'PLANS.SAVE_ITEMS_FAILED'
  | 'PLANS.DELETE_ITEMS_FAILED'
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
  'USERS.SEARCH_FAILED': {
    message: "We couldn't search for users. Please try again later.",
    notify: true,
    log: true,
  },

  // Templates errors
  'TEMPLATES.LOAD_FAILED': {
    message: "We couldn't load your templates. Please refresh or try again later.",
    notify: true,
    log: true,
  },
  'TEMPLATES.LOAD_TEMPLATE_FAILED': {
    message: "We couldn't load that template. Please try again or check if it still exists.",
    notify: true,
    log: true,
  },
  'TEMPLATES.CREATE_FAILED': {
    message: "We couldn't create your template. Please check your details and try again.",
    notify: true,
    log: true,
  },
  'TEMPLATES.UPDATE_FAILED': {
    message: "We couldn't save your template changes. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATES.DELETE_FAILED': {
    message: "We couldn't delete that template. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATES.DUPLICATE_NAME': {
    message: 'You already have a template with this name. Please choose a different name.',
    notify: true,
    log: true,
  },
  'TEMPLATES.NAME_VALIDATION_FAILED': {
    message: 'Template name validation failed. Please check your input and try again.',
    notify: true,
    log: true,
  },
  'TEMPLATES.LOAD_SHARES_FAILED': {
    message: "We couldn't load the sharing information. Please refresh or try again later.",
    notify: true,
    log: true,
  },
  'TEMPLATES.SHARE_FAILED': {
    message: "We couldn't share that template. Please check the email address and try again.",
    notify: true,
    log: true,
  },
  'TEMPLATES.UNSHARE_FAILED': {
    message: "We couldn't remove access to that template. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATES.UPDATE_PERMISSION_FAILED': {
    message: "We couldn't update the access permissions. Please try again.",
    notify: true,
    log: true,
  },

  // Categories errors
  'CATEGORIES.LOAD_FAILED': {
    message: "We couldn't load your categories. Please refresh or try again later.",
    notify: true,
    log: true,
  },

  // Template Items errors
  'TEMPLATE_ITEMS.LOAD_FAILED': {
    message: "We couldn't load the template items. Please refresh or try again later.",
    notify: true,
    log: true,
  },
  'TEMPLATE_ITEMS.CREATE_FAILED': {
    message: "We couldn't add that item to your template. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATE_ITEMS.UPDATE_FAILED': {
    message: "We couldn't save your item changes. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATE_ITEMS.DELETE_FAILED': {
    message: "We couldn't remove that item from your template. Please try again.",
    notify: true,
    log: true,
  },
  'TEMPLATE_ITEMS.VALIDATION_FAILED': {
    message:
      'Please add at least one item with a name, category, and valid amount to create your template.',
    notify: true,
    log: false,
  },
  'TEMPLATE_ITEMS.DUPLICATE_NAME_CATEGORY': {
    message:
      'You already have an item with this name in this category. Please choose a different name.',
    notify: true,
    log: true,
  },
  'TEMPLATE_ITEMS.NAME_REQUIRED': {
    message:
      'Please add at least one item with a name, category, and valid amount to create your template.',
    notify: true,
    log: false,
  },

  // Plans errors
  'PLANS.LOAD_FAILED': {
    message: "We couldn't load your plans. Please refresh or try again later.",
    notify: true,
    log: true,
  },
  'PLANS.LOAD_PLAN_FAILED': {
    message: "We couldn't load that plan. Please try again or check if it still exists.",
    notify: true,
    log: true,
  },
  'PLANS.CREATE_FAILED': {
    message: "We couldn't create your plan. Please check your details and try again.",
    notify: true,
    log: true,
  },
  'PLANS.UPDATE_FAILED': {
    message: "We couldn't save your plan changes. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.DELETE_FAILED': {
    message: "We couldn't delete that plan. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.CANCEL_FAILED': {
    message: "We couldn't cancel that plan. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.LOAD_SHARED_USERS_FAILED': {
    message: "We couldn't load the users this plan is shared with. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.SHARE_FAILED': {
    message: "We couldn't share that plan. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.UNSHARE_FAILED': {
    message: "We couldn't remove access to that plan. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.UPDATE_PERMISSION_FAILED': {
    message: "We couldn't update the access permissions. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.DUPLICATE_NAME': {
    message: 'You already have a plan with this name. Please choose a different name.',
    notify: true,
    log: true,
  },
  'PLANS.USER_NOT_FOUND': {
    message: "We couldn't find a user with that email address. Please check and try again.",
    notify: true,
    log: true,
  },
  'PLANS.ALREADY_SHARED': {
    message: 'This plan is already shared with that user.',
    notify: true,
    log: true,
  },
  'PLANS.SEARCH_USERS_FAILED': {
    message: "We couldn't search for users. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.SAVE_ITEMS_FAILED': {
    message: "We couldn't save the plan items. Please try again.",
    notify: true,
    log: true,
  },
  'PLANS.DELETE_ITEMS_FAILED': {
    message: "We couldn't remove those items from your plan. Please try again.",
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
