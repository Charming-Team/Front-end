import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/Dashboard.vue') },
    { path: '/register', component: () => import('./pages/RegisterPage.vue') },
    { path: '/login', component: () => import('./pages/LoginPage.vue') },
  ],
})

export default router
