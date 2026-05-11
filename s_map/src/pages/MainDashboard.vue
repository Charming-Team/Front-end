<template>
  <MainLayout
    page-title="대시보드"
    page-description="실시간 운영 현황을 한눈에 확인하세요."
    active-menu="dashboard"
    user-name="관리자"
  >
    <DashboardMetricGrid :metrics="metrics" />

    <section class="middle-grid">
      <ProductionSchedulePanel
        schedule-date="2024년 5월 3주차"
        :week-timeline="weekTimeline"
        :gantt-rows="ganttRows"
        :legend="legend"
      />
      <OrderStatusPanel :orders="orders" :average-rate="58" />
    </section>

    <UtilizationPanel :items="utilization" />
  </MainLayout>
</template>

<script setup>
import DashboardMetricGrid from "../components/dashboard/DashboardMetricGrid.vue";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel.vue";
import ProductionSchedulePanel from "../components/dashboard/ProductionSchedulePanel.vue";
import UtilizationPanel from "../components/dashboard/UtilizationPanel.vue";
import MainLayout from "../layouts/MainLayout.vue";

const metrics = [
  {
    title: "지연 위험 주문",
    value: "18",
    unit: "건",
    caption: "전체 주문 대비",
    change: "8%",
    tone: "danger",
  },
  {
    title: "자재 부족 품목",
    value: "2",
    unit: "건",
    caption: "전체 품목 대비",
    change: "3%",
    tone: "warning",
  },
  {
    title: "주문별 달성률",
    value: "98",
    unit: "%",
    caption: "목표 대비",
    change: "98%",
    tone: "success",
  },
  { title: "생산계획 절약비용", value: "37", unit: "일" },
];

const weekTimeline = [
  "월 05.20",
  "화 05.21",
  "수 05.22",
  "목 05.23",
  "금 05.24",
  "토 05.25",
  "일 05.26",
];

const ganttRows = [
  {
    name: "Line A",
    segments: [
      { type: "planned", left: 0, width: 17 },
      { type: "running", left: 17, width: 22 },
      { type: "change", left: 39, width: 7 },
      { type: "running", left: 46, width: 42 },
    ],
  },
  {
    name: "Line B",
    segments: [
      { type: "planned", left: 0, width: 12 },
      { type: "running", left: 12, width: 27 },
      { type: "change", left: 39, width: 13 },
      { type: "running", left: 52, width: 18 },
    ],
  },
  {
    name: "Line C",
    segments: [
      { type: "planned", left: 0, width: 7 },
      { type: "running", left: 7, width: 32 },
      { type: "change", left: 39, width: 9 },
      { type: "running", left: 48, width: 30 },
    ],
  },
  {
    name: "Line D",
    segments: [
      { type: "change", left: 0, width: 13 },
      { type: "delay", left: 13, width: 13 },
      { type: "running", left: 26, width: 22 },
      { type: "empty", left: 48, width: 12 },
    ],
  },
  {
    name: "Line E",
    segments: [
      { type: "planned", left: 0, width: 15 },
      { type: "running", left: 15, width: 29 },
      { type: "change", left: 44, width: 8 },
      { type: "running", left: 52, width: 26 },
    ],
  },
  {
    name: "Line F",
    segments: [
      { type: "planned", left: 0, width: 10 },
      { type: "delay", left: 10, width: 16 },
      { type: "running", left: 26, width: 24 },
      { type: "empty", left: 50, width: 14 },
    ],
  },
];

const legend = [
  { label: "계획", type: "planned" },
  { label: "진행", type: "running" },
  { label: "전환", type: "change" },
  { label: "지연", type: "delay" },
  { label: "비가동", type: "empty" },
];

const orders = [
  { id: "PO-240520-001", due: "05.22 (수)", progress: 72 },
  { id: "PO-240520-002", due: "05.23 (목)", progress: 30, delayed: true },
  { id: "PO-240520-003", due: "05.24 (금)", progress: 50 },
  { id: "PO-240520-004", due: "05.25 (토)", progress: 90 },
  { id: "PO-240520-005", due: "05.26 (일)", progress: 20, delayed: true },
];

const utilization = [
  { name: "Line A", value: 80 },
  { name: "Line B", value: 55 },
  { name: "Line C", value: 60 },
  { name: "Line D", value: 36, low: true },
  { name: "Line E", value: 72 },
  { name: "Line F", value: 42, low: true },
];
</script>

<style scoped>
.middle-grid {
  display: grid;
  grid-template-columns: minmax(560px, 1.35fr) minmax(420px, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}

@media (max-width: 1280px) {
  .middle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .middle-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}
</style>
