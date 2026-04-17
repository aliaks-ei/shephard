import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
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
      },
      {
        path: 'plans',
        component: () => import('pages/PlansPage.vue'),
        name: 'plans',
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
      requiresAuth: false,
    },
  },
]

export default routes
