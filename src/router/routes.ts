import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', component: () => import('pages/IndexPage.vue') }],
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/auth',
    component: () => import('pages/AuthPage.vue'),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: '/auth/callback',
    component: () => import('pages/AuthCallbackPage.vue'),
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
];

export default routes;
