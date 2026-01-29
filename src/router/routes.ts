import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: {
          prefetch: ['/plans', '/templates'],
        },
      },
      {
        path: 'settings',
        component: () => import('pages/UserSettingsPage.vue'),
        name: 'settings',
      },
      {
        path: 'templates',
        component: () => import('pages/TemplatesPage.vue'),
        name: 'templates',
        meta: {
          prefetch: ['/templates/new'],
        },
      },
      {
        path: 'templates/new',
        component: () => import('pages/TemplatePage.vue'),
        name: 'new-template',
      },
      {
        path: 'templates/:id',
        component: () => import('pages/TemplatePage.vue'),
        name: 'template',
        meta: {
          prefetch: ['/templates'],
        },
      },
      {
        path: 'categories',
        component: () => import('pages/CategoriesPage.vue'),
        name: 'categories',
      },
      {
        path: 'plans',
        component: () => import('pages/PlansPage.vue'),
        name: 'plans',
        meta: {
          prefetch: ['/plans/new'],
        },
      },
      {
        path: 'plans/new',
        component: () => import('pages/PlanPage.vue'),
        name: 'new-plan',
      },
      {
        path: 'plans/:id',
        component: () => import('pages/PlanPage.vue'),
        name: 'plan',
        meta: {
          prefetch: ['/plans'],
        },
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    meta: {
      requiresAuth: false,
    },
    children: [
      {
        path: '',
        component: () => import('pages/AuthPage.vue'),
        name: 'auth',
      },
      {
        path: 'callback',
        component: () => import('pages/AuthCallbackPage.vue'),
        name: 'auth-callback',
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
    meta: {
      requiresAuth: true,
    },
  },
]

export default routes
