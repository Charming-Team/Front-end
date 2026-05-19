import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "./utils/storage.js";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/admin",
      component: () => import("./pages/admin/AdminDashboardPage.vue"),
      meta: {
        requiresAuth: true,
        layout: "admin",
        pageTitle: "서버관리자 대시보드",
        pageDescription: "S-MAP 시스템 현황",
        activeMenu: "admin-dashboard",
        userName: "서버 관리자",
      },
    },
    {
      path: "/admin/register",
      component: () => import("./pages/admin/AdminRegisterPage.vue"),
      meta: {
        requiresAuth: true,
        layout: "admin",
        pageTitle: "회원등록",
        pageDescription: "새 사용자 계정을 등록합니다.",
        activeMenu: "admin-register",
        userName: "서버 관리자",
      },
    },
    {
      path: "/admin/users",
      component: () => import("./pages/admin/AdminUsersPage.vue"),
      meta: {
        requiresAuth: true,
        layout: "admin",
        pageTitle: "사용자 조회",
        pageDescription: "등록된 사용자 계정과 권한 상태를 확인합니다.",
        activeMenu: "admin-users",
        userName: "서버 관리자",
      },
    },
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
      path: "/orders",
      component: () => import("./pages/orders/OrderManagementPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "주문 관리",
        pageDescription: "주문 현황을 조회하고 관리할 수 있습니다.",
        activeMenu: "orders",
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
      path: "/risk",
      component: () => import("./pages/risk/RiskAnalysisPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "리스크 분석",
        pageDescription: "각 주문의 리스크를 분석하고 원인을 파악하세요.",
        activeMenu: "risks",
      },
    },
    {
      path: "/risk/:orderNo",
      component: () => import("./pages/risk/RiskDetailPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "리스크 상세 분석",
        pageDescription:
          "선택한 주문의 지연 위험 원인과 대응 방안을 확인하세요.",
        activeMenu: "risks",
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
        pageDescription:
          "AI가 분석한 결과를 기반으로 최적의 생산 계획과 대응안을 생성했습니다.",
        activeMenu: "production",
      },
    },
    {
      path: "/ai/detail",
      component: () => import("./pages/ai/AiDetailPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "대응안 상세 비교",
        pageDescription:
          "선택한 대응안의 적용 조건과 시뮬레이션 결과를 비교 분석합니다.",
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
        activeMenu: "reports",
      },
    },
    {
      path: "/reports/:id",
      component: () => import("./pages/report/ReportDetailPage.vue"),
      meta: {
        requiresAuth: true,
        pageTitle: "보고서",
        pageDescription: "생성된 보고서의 상세 내용을 확인합니다.",
        activeMenu: "reports",
      },
    },
  ],
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) return "/login";
});

export default router;
