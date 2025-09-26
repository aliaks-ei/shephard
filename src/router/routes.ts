import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'settings', component: () => import('pages/UserSettingsPage.vue'), name: 'settings' },
      { path: 'templates', component: () => import('pages/TemplatesPage.vue'), name: 'templates' },
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
        path: 'categories',
        component: () => import('pages/CategoriesPage.vue'),
        name: 'categories',
      },
      { path: 'plans', component: () => import('pages/PlansPage.vue'), name: 'plans' },
      {
        path: 'plans/new',
        component: () => import('pages/PlanPage.vue'),
        name: 'new-plan',
      },
      {
        path: 'plans/:id',
        component: () => import('pages/PlanPage.vue'),
        name: 'plan',
        redirect: { name: 'plan-overview' },
        children: [
          {
            path: 'overview',
            component: () => import('pages/PlanPage.vue'),
            name: 'plan-overview',
          },
          {
            path: 'items',
            component: () => import('pages/PlanPage.vue'),
            name: 'plan-items',
          },
          {
            path: 'edit',
            component: () => import('pages/PlanPage.vue'),
            name: 'plan-edit',
          },
        ],
      },
    ],
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/auth',
    component: () => import('pages/AuthPage.vue'),
    name: 'auth',
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/auth/callback',
    component: () => import('pages/AuthCallbackPage.vue'),
    name: 'auth-callback',
    meta: {
      requiresAuth: false,
    },
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
