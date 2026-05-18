<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AlarmButton from '../components/common/AlarmButton.vue'
import UserChip from '../components/common/UserChip.vue'
import { clearToken } from '../utils/storage.js'
import logoSymbol from '../assets/logo_main.svg'

defineProps({
  pageTitle: {
    type: String,
    default: '서버관리자 대시보드',
  },
  pageDescription: {
    type: String,
    default: 'S-MAP 시스템 현황',
  },
  activeMenu: {
    type: String,
    default: 'admin-dashboard',
  },
  userName: {
    type: String,
    default: '서버 관리자',
  },
  notificationCount: {
    type: [Number, String],
    default: 15,
  },
})

const router = useRouter()

const icons = {
  dashboard: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </svg>
  `,
  userPlus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>`,
}

const navigation = [
  { key: 'admin-dashboard', label: '대시보드', icon: icons.dashboard, to: '/admin' },
  { key: 'admin-register', label: '회원등록', icon: icons.userPlus, to: '/admin/register' },
  { key: 'admin-users', label: '사용자 조회', icon: icons.users },
]

const userMenuOpen = ref(false)
const userMenuRef = ref(null)

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function onDocumentClick(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocumentClick))
onUnmounted(() => document.removeEventListener('click', onDocumentClick))

function logout() {
  userMenuOpen.value = false
  clearToken()
  router.push('/login')
}
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar d-flex flex-column text-white">
      <div class="brand d-flex align-items-center">
        <img class="brand-logo" :src="logoSymbol" alt="" />
        <span>S-MAP</span>
      </div>

      <nav class="nav-list d-flex flex-column" aria-label="Admin navigation">
        <template
          v-for="item in navigation"
          :key="item.key"
        >
          <RouterLink
            v-if="item.to"
            class="nav-item position-relative d-flex align-items-center text-decoration-none"
            :class="{ active: item.key === activeMenu }"
            :to="item.to"
          >
            <span class="nav-icon d-grid" v-html="item.icon"></span>
            <span>{{ item.label }}</span>
          </RouterLink>
          <button
            v-else
            class="nav-item position-relative d-flex align-items-center text-decoration-none border-0 bg-transparent text-start"
            :class="{ active: item.key === activeMenu }"
            type="button"
          >
            <span class="nav-icon d-grid" v-html="item.icon"></span>
            <span>{{ item.label }}</span>
          </button>
        </template>
      </nav>
    </aside>

    <main class="main-content">
      <header class="topbar d-flex justify-content-between align-items-start">
        <div>
          <h1 class="mb-2">{{ pageTitle }}</h1>
          <p class="m-0">{{ pageDescription }}</p>
        </div>

        <div class="top-actions d-flex align-items-center">
          <AlarmButton :count="notificationCount" />
          <div ref="userMenuRef" class="position-relative">
            <div style="cursor: pointer;" @click.stop="toggleUserMenu">
              <UserChip :label="userName" />
            </div>
            <div
              v-if="userMenuOpen"
              class="position-absolute end-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
              style="top: calc(100% + 6px); min-width: 150px; z-index: 200; box-shadow: 0 8px 24px rgba(15,23,42,0.12);"
            >
              <button
                type="button"
                class="d-flex align-items-center gap-2 w-100 border-0 bg-transparent text-start"
                style="padding: 10px 16px; font-size: 14px; font-weight: 600; color: var(--color-text-main); cursor: pointer;"
                @click="logout"
              >
                <svg viewBox="0 0 24 24" style="width:16px;height:16px;flex-shrink:0;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>

<style scoped src="./styles/main-layout.css"></style>
