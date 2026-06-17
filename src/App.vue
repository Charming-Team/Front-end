<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'
import AdminLayout from './layouts/AdminLayout.vue'
import { getUserInfo } from './utils/storage.js'

const route = useRoute()

const AUTH_PATHS = ['/login', '/register']
const currentUser = ref(getUserInfo())

const useMainLayout = computed(() => !AUTH_PATHS.includes(route.path))
const useAdminLayout = computed(() => route.meta.layout === 'admin')
const pageTitle = computed(() => route.meta.pageTitle ?? '대시보드')
const pageDescription = computed(() => route.meta.pageDescription ?? '실시간 운영 현황을 한눈에 확인하세요.')
const activeMenu = computed(() => route.meta.activeMenu ?? 'dashboard')
const userName = computed(() => currentUser.value?.name ?? route.meta.userName ?? '관리자')
const notificationCount = computed(() => route.meta.notificationCount ?? 15)

watch(
  () => route.fullPath,
  () => {
    currentUser.value = getUserInfo()
  },
  { immediate: true }
)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="!useMainLayout" />
    <AdminLayout
      v-else-if="useAdminLayout"
      :page-title="pageTitle"
      :page-description="pageDescription"
      :active-menu="activeMenu"
      :user-name="userName"
      :notification-count="notificationCount"
    >
      <component :is="Component" />
    </AdminLayout>
    <MainLayout
      v-else
      :page-title="pageTitle"
      :page-description="pageDescription"
      :active-menu="activeMenu"
      :user-name="userName"
      :notification-count="notificationCount"
    >
      <component :is="Component" />
    </MainLayout>
  </RouterView>
</template>
