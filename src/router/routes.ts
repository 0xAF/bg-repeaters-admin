import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'request', name: 'guest-request', component: () => import('pages/GuestRequestPage.vue') },
      {
        path: 'request/submitted/:id?',
        name: 'guest-request-submitted',
        component: () => import('pages/RequestSubmittedPage.vue'),
      },
      // Public repeaters view (create/edit/delete gated inside component by auth state)
      { path: 'repeaters', component: () => import('pages/AdminRepeatersPage.vue') },
      { path: 'admin/repeaters', component: () => import('pages/AdminRepeatersPage.vue'), meta: { requiresAuth: true } },
      { path: 'admin/requests', component: () => import('pages/AdminRequestsPage.vue'), meta: { requiresAuth: true } },
      { path: 'admin/users', component: () => import('pages/AdminUsersPage.vue'), meta: { requiresAuth: true } },
      { path: 'changelog', component: () => import('pages/ChangelogPage.vue') },
    ],
  },


  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
