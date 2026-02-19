export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    withStats: (userId: string) => [...queryKeys.categories.all, 'with-stats', userId] as const,
  },
  templates: {
    all: ['templates'] as const,
    list: (userId: string) => [...queryKeys.templates.all, 'list', userId] as const,
    detail: (templateId: string, userId: string) =>
      [...queryKeys.templates.all, 'detail', templateId, userId] as const,
    sharedUsers: (templateId: string) =>
      [...queryKeys.templates.all, 'shared-users', templateId] as const,
  },
  plans: {
    all: ['plans'] as const,
    list: (userId: string) => [...queryKeys.plans.all, 'list', userId] as const,
    detail: (planId: string, userId: string) =>
      [...queryKeys.plans.all, 'detail', planId, userId] as const,
    items: (planId: string) => [...queryKeys.plans.all, 'items', planId] as const,
    sharedUsers: (planId: string) => [...queryKeys.plans.all, 'shared-users', planId] as const,
  },
  expenses: {
    all: ['expenses'] as const,
    byPlan: (planId: string) => [...queryKeys.expenses.all, 'by-plan', planId] as const,
    summary: (planId: string) => [...queryKeys.expenses.all, 'summary', planId] as const,
    lastForPlan: (planId: string) => [...queryKeys.expenses.all, 'last', planId] as const,
    byDateRange: (planId: string, start: string, end: string) =>
      [...queryKeys.expenses.all, 'date-range', planId, start, end] as const,
    byCategory: (planId: string, categoryId: string) =>
      [...queryKeys.expenses.all, 'by-category', planId, categoryId] as const,
  },
  users: {
    all: ['users'] as const,
    search: (query: string) => [...queryKeys.users.all, 'search', query] as const,
  },
} as const
