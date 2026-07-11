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
    recentAll: () => [...queryKeys.expenses.all, 'recent'] as const,
    recent: (userId: string, search: string, categoryId: string, sortBy: string) =>
      [...queryKeys.expenses.recentAll(), userId, search, categoryId, sortBy] as const,
    byPlan: (planId: string) => [...queryKeys.expenses.all, 'by-plan', planId] as const,
    exportByPlan: (planId: string) => [...queryKeys.expenses.byPlan(planId), 'export'] as const,
    recentByPlan: (planId: string, limit: number) =>
      [...queryKeys.expenses.byPlan(planId), 'recent', limit] as const,
    byPlanItem: (planId: string, planItemId: string) =>
      [...queryKeys.expenses.byPlan(planId), 'item', planItemId] as const,
    summary: (planId: string) => [...queryKeys.expenses.all, 'summary', planId] as const,
    overviewSnapshotsAll: () => [...queryKeys.expenses.all, 'overview-snapshots'] as const,
    overviewSnapshots: (planIds: string[]) =>
      [...queryKeys.expenses.overviewSnapshotsAll(), ...planIds] as const,
    lastForPlan: (planId: string) => [...queryKeys.expenses.all, 'last', planId] as const,
    dateRanges: (planId: string) => [...queryKeys.expenses.all, 'date-range', planId] as const,
    byDateRange: (planId: string, start: string, end: string) =>
      [...queryKeys.expenses.dateRanges(planId), start, end] as const,
    categories: (planId: string) => [...queryKeys.expenses.all, 'by-category', planId] as const,
    byCategory: (planId: string, categoryId: string) =>
      [...queryKeys.expenses.categories(planId), categoryId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    listAll: (userId: string) => [...queryKeys.notifications.all, 'list', userId] as const,
    list: (userId: string, limit: number) =>
      [...queryKeys.notifications.all, 'list', userId, limit] as const,
    unreadCount: (userId: string) =>
      [...queryKeys.notifications.all, 'unread-count', userId] as const,
  },
  users: {
    all: ['users'] as const,
    search: (entityType: 'plan' | 'template', entityId: string, query: string) =>
      [...queryKeys.users.all, 'search', entityType, entityId, query] as const,
  },
} as const
