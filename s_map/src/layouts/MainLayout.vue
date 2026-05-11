<script setup>
import { useRouter } from 'vue-router'
import AlarmButton from '../components/common/AlarmButton.vue'
import UserChip from '../components/common/UserChip.vue'
import ChatbotButton from '../features/chatbot/components/ChatbotButton.vue'
import { clearToken } from '../utils/storage.js'
import logoSymbol from '../assets/s-map-logo-symbol.svg'

defineProps({
  pageTitle: {
    type: String,
    default: '대시보드',
  },
  pageDescription: {
    type: String,
    default: '실시간 운영 현황을 한눈에 확인하세요.',
  },
  activeMenu: {
    type: String,
    default: 'dashboard',
  },
  userName: {
    type: String,
    default: '관리자',
  },
  notificationCount: {
    type: [Number, String],
    default: 15,
  },
})

const router = useRouter()

const baseIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </svg>
`

const icons = {
  dashboard: baseIcon,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>`,
  plan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z" /><path d="m9 12 2 2 4-5" /></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z" /><path d="m8 8 4-4 4 4" /></svg>`,
  line: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4ZM14 5h6v6h-6ZM4 15h6v4H4ZM14 15h6v4h-6Z" /></svg>`,
  risk: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 10 17H2L12 4Z" /><path d="M12 10v5M12 18h.01" /></svg>`,
  report: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5Z" /><path d="M8 9h8M8 13h5M16 14l2 2 3-4" /></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>`,
}

const navigation = [
  { key: 'dashboard', label: '대시보드', icon: icons.dashboard, to: '/' },
  { key: 'orders', label: '주문 관리', icon: icons.calendar, to: '/' },
  { key: 'production', label: '생산계획', icon: icons.plan, to: '/plan' },
  { key: 'materials', label: '자재 현황', icon: icons.box, to: '/' },
  { key: 'lines', label: '라인 현황', icon: icons.line, to: '/' },
  { key: 'risks', label: '리스크 분석', icon: icons.risk, to: '/' },
  { key: 'reports', label: '보고서', icon: icons.report, to: '/' },
]

function logout() {
  clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar flex flex-col text-white">
      <div class="brand flex items-center">
        <img class="brand-logo" :src="logoSymbol" alt="" />
        <span>S-MAP</span>
      </div>

      <nav class="nav-list flex flex-col" aria-label="Main navigation">
        <RouterLink
          v-for="item in navigation"
          :key="item.key"
          class="nav-item relative flex items-center no-underline"
          :class="{ active: item.key === activeMenu }"
          :to="item.to"
        >
          <span class="nav-icon grid" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <button class="nav-item logout-button relative flex items-center no-underline" type="button" @click="logout">
        <span class="nav-icon grid" v-html="icons.logout"></span>
        <span>로그아웃</span>
      </button>
    </aside>

    <main class="main-content">
      <header class="topbar flex items-start justify-between">
        <div>
          <h1 class="mb-2">{{ pageTitle }}</h1>
          <p class="m-0">{{ pageDescription }}</p>
        </div>

        <div class="top-actions flex items-center">
          <AlarmButton :count="notificationCount" />
          <UserChip :label="userName" />
        </div>
      </header>

      <slot />
    </main>

    <ChatbotButton />
  </div>
</template>

<style scoped src="./styles/main-layout.css"></style>
