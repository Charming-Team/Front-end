<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './layouts/MainLayout.vue'

const route = useRoute()

const AUTH_PATHS = ['/login', '/register']

const useMainLayout = computed(() => !AUTH_PATHS.includes(route.path))
const pageTitle = computed(() => route.meta.pageTitle ?? '대시보드')
const pageDescription = computed(() => route.meta.pageDescription ?? '실시간 운영 현황을 한눈에 확인하세요.')
const activeMenu = computed(() => route.meta.activeMenu ?? 'dashboard')
const userName = computed(() => route.meta.userName ?? '관리자')
const notificationCount = computed(() => route.meta.notificationCount ?? 15)
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="!useMainLayout" />
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