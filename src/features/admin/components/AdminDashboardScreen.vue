<script setup>
import { computed, onMounted, ref } from 'vue'
import DashboardMetricCard from '../../../components/dashboard/DashboardMetricCard.vue'
import { fetchAdminDashboard } from '../api.js'

const ROLE_TONES = {
  ADMIN: 'red',
  EXECUTIVE: 'orange',
  MANUFACTURING_MANAGER: 'green',
  OPERATOR: 'gray',
}

const dashboard = ref({
  totalUsers: 0,
  activeUsers: 0,
  roleDistribution: [],
})
const loading = ref(false)
const error = ref('')

const metrics = computed(() => [
  {
    title: '전체 사용자',
    value: loading.value ? '-' : String(dashboard.value.totalUsers),
    unit: '명',
  },
  {
    title: '활성 사용자',
    value: loading.value ? '-' : String(dashboard.value.activeUsers),
    unit: '명',
  },
])

const roleDistribution = computed(() => {
  const roles = dashboard.value.roleDistribution ?? []
  const maxCount = Math.max(...roles.map(role => role.count), 0)

  return roles.map(role => ({
    label: role.roleName || role.role,
    count: role.count,
    percent: maxCount > 0 ? Math.max((role.count / maxCount) * 100, 2) : 0,
    tone: ROLE_TONES[role.role] ?? 'gray',
  }))
})

async function loadDashboard() {
  loading.value = true
  error.value = ''

  try {
    dashboard.value = await fetchAdminDashboard() ?? {
      totalUsers: 0,
      activeUsers: 0,
      roleDistribution: [],
    }
  } catch (err) {
    error.value = err.message || '관리자 대시보드를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDashboard())
</script>

<template>
  <section class="row g-3 mb-3" aria-label="관리자 주요 지표">
    <DashboardMetricCard
      v-for="metric in metrics"
      :key="metric.title"
      class="col-12 col-md-6"
      :metric="metric"
    />
  </section>

  <section class="admin-role-section">
    <article class="card admin-panel dashboard-panel">
      <div class="panel-header d-flex justify-content-between align-items-center gap-3">
        <h2 class="panel-title mb-0">권한별 사용자 분포</h2>
      </div>

      <p v-if="error" class="admin-message admin-message-error">{{ error }}</p>
      <p v-else-if="loading" class="admin-message">사용자 현황을 불러오는 중입니다.</p>
      <div class="role-list">
        <div v-for="role in roleDistribution" :key="role.label" class="role-row">
          <div class="role-row-meta">
            <span>{{ role.label }}</span>
            <strong>{{ role.count }}명</strong>
          </div>
          <div class="role-track">
            <i :class="role.tone" :style="{ width: `${role.percent}%` }"></i>
          </div>
        </div>
        <p v-if="!loading && !error && roleDistribution.length === 0" class="admin-message">
          표시할 사용자 현황이 없습니다.
        </p>
      </div>
    </article>
  </section>
</template>

<style scoped src="../styles/admin-dashboard.css"></style>
