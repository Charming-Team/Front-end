<script setup>
import DashboardMetricCard from '../../../components/dashboard/DashboardMetricCard.vue'

const metrics = [
  {
    title: '전체 사용자',
    value: '124',
    unit: '명',
  },
  {
    title: '활성 사용자',
    value: '98',
    unit: '명',
  },
]

const roleDistribution = [
  { label: '서버관리자', count: 3, percent: 3, tone: 'red' },
  { label: '경영진', count: 8, percent: 9, tone: 'orange' },
  { label: '제조관리직', count: 24, percent: 27, tone: 'green' },
  { label: '작업자', count: 89, percent: 100, tone: 'gray' },
]
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

      <div class="role-list">
        <div v-for="role in roleDistribution" :key="role.label" class="role-row">
          <div class="role-row__meta">
            <span>{{ role.label }}</span>
            <strong>{{ role.count }}명</strong>
          </div>
          <div class="role-track">
            <i :class="role.tone" :style="{ width: `${role.percent}%` }"></i>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped src="../styles/admin-dashboard.css"></style>
