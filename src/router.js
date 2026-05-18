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
      path: "/materials",
      component: () => import("./pages/materials/MaterialStatusPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "자재 현황",
        pageDescription: "자재 재고 및 상태를 실시간으로 확인하세요.",
        activeMenu: "materials",
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
    {
      path: "/ai/result",
      component: () => import("./pages/ai/AiResultPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "생산 계획 생성 완료",
        pageDescription: "AI가 분석한 결과를 기반으로 최적의 생산 계획과 대응안을 생성했습니다.",
        activeMenu: "production",
      },
    },
    {
      path: "/ai/detail",
      component: () => import("./pages/ai/AiDetailPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "대응안 상세 비교",
        pageDescription: "선택한 대응안의 적용 조건과 시뮬레이션 결과를 비교 분석합니다.",
        activeMenu: "production",
      },
    },
    {
      path: "/reports",
      component: () => import("./pages/report/ReportPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "보고서",
        pageDescription: "보고서 작성 및 이력을 확인하고 관리할 수 있습니다.",
        activeMenu: "report",
      },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) return "/login";
});

export default router;
