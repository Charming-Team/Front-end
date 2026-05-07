<script setup>
import { useRouter, useRoute } from 'vue-router'
import { clearToken } from '../utils/storage.js'
import logoSymbol from '../assets/logo.png'

const router = useRouter()
const route = useRoute()

const icons = {
  dashboard: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" /></svg>`,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>`,
  plan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z" /><path d="m9 12 2 2 4-5" /></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z" /><path d="m8 8 4-4 4 4" /></svg>`,
  line: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4ZM14 5h6v6h-6ZM4 15h6v4H4ZM14 15h6v4h-6Z" /></svg>`,
  risk: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 10 17H2L12 4Z" /><path d="M12 10v5M12 18h.01" /></svg>`,
  report: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5Z" /><path d="M8 9h8M8 13h5M16 14l2 2 3-4" /></svg>`,
  register: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>`,
}

const navLinks = [
  { label: '대시보드', to: '/', icon: icons.dashboard },
  { label: '주문 관리', to: '/', icon: icons.calendar },
  { label: '생산계획', to: '/', icon: icons.plan },
  { label: '자재 현황', to: '/', icon: icons.box },
  { label: '라인 현황', to: '/', icon: icons.line },
  { label: '리스크 분석', to: '/', icon: icons.risk },
  { label: '보고서', to: '/', icon: icons.report },
  { label: '사용자 등록', to: '/register', icon: icons.register },
]

function logout() { clearToken(); router.push('/login') }
</script>

<template>
  <div class="layout-page">
    <aside class="layout-sidebar">
      <div class="layout-brand">
        <img class="layout-brand-logo" :src="logoSymbol" alt="" />
        <span>S-MAP</span>
      </div>

      <nav class="layout-nav" aria-label="Main navigation">
        <RouterLink
          v-for="item in navLinks"
          :key="item.label"
          :to="item.to"
          class="layout-nav-item"
          :class="{ active: route.path === item.to && item.to !== '/' || route.path === item.to }"
          exact-active-class="active"
          active-class=""
        >
          <span class="layout-nav-icon" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button class="layout-nav-item layout-logout" type="button" @click="logout">
        <span class="layout-nav-icon" v-html="icons.logout"></span>
        <span>로그아웃</span>
      </button>
    </aside>

    <main class="layout-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  background: #f8fafc;
  color: #0d1f3c;
  font-family: "Pretendard Variable", Pretendard, "Noto Sans KR", Inter, -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  word-break: keep-all;
}

.layout-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0d1f3c;
  color: #fff;
  box-shadow: 12px 0 32px rgba(13, 31, 60, 0.4);
}

.layout-brand {
  height: 122px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 30px;
  font-size: 30px;
  font-weight: 800;
}

.layout-brand-logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  padding: 5px;
  border-radius: 8px;
  background: #fff;
}

.layout-nav {
  display: flex;
  flex-direction: column;
}

.layout-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  height: 74px;
  padding: 0 34px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: -0.1px;
  transition: background 0.15s;
}

.layout-nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
}

.layout-nav-item.active {
  background: #1565c0;
  color: #fff;
}

.layout-nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 9px;
  background: #4a9eff;
}

.layout-nav-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
}

.layout-nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.layout-logout {
  margin-top: auto;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.55);
}

.layout-logout:hover {
  background: rgba(229, 57, 53, 0.18);
  color: #ff7070;
}

.layout-main {
  min-width: 0;
  padding: 28px 54px 34px 24px;
}
</style>
