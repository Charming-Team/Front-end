import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "./utils/storage.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: () => import("./pages/Dashboard.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "대시보드",
        pageDescription: "실시간 운영 현황을 한눈에 확인하세요.",
        activeMenu: "dashboard",
      },
    },
    {
      path: "/plan",
      component: () => import("./pages/plan/PlanPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "생산계획 관리",
        pageDescription: "적용된 생산계획 목록과 상세 정보를 확인합니다.",
        activeMenu: "production",
      },
    },
    {
      path: "/register",
      component: () => import("./pages/RegisterPage.vue"),
    },
    {
      path: "/login",
      component: () => import("./features/auth/pages/LoginPage.vue"),
    },
    {
      path: "/ai/analysis",
      component: () => import("./pages/ai/AiAnalysisPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "AI 분석",
        pageDescription: "AI가 생산계획 데이터를 분석합니다.",
        activeMenu: "production",
      },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) return "/login";
});

export default router;
