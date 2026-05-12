<template>
  <DashboardMetricGrid :metrics="metrics" />

  <section class="dashboard-middle-grid mb-3">
    <ProductionSchedulePanel
      base-week-start="2024-05-20"
      :gantt-rows="ganttRows"
      :legend="legend"
    />
    <OrderStatusPanel :orders="orders" :average-rate="58" />
  </section>

  <UtilizationPanel :items="utilization" />
</template>

<script setup>
import DashboardMetricGrid from "../components/dashboard/DashboardMetricGrid.vue";
import OrderStatusPanel from "../components/dashboard/OrderStatusPanel.vue";
import ProductionSchedulePanel from "../components/dashboard/ProductionSchedulePanel.vue";
import UtilizationPanel from "../components/dashboard/UtilizationPanel.vue";

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

const ganttRows = [
  {
    name: "Line A",
    segments: [
      { type: "running", left: 0, width: 29 },
      { type: "change", left: 29, width: 8 },
      { type: "running", left: 37, width: 26 },
      { type: "planned", left: 63, width: 25 },
    ],
  },
  {
    name: "Line B",
    segments: [
      { type: "running", left: 0, width: 21 },
      { type: "delay", left: 21, width: 12 },
      { type: "running", left: 33, width: 25 },
      { type: "empty", left: 58, width: 12 },
      { type: "planned", left: 70, width: 18 },
    ],
  },
  {
    name: "Line C",
    segments: [
      { type: "running", left: 0, width: 34 },
      { type: "change", left: 34, width: 9 },
      { type: "running", left: 43, width: 20 },
      { type: "planned", left: 63, width: 20 },
    ],
  },
  {
    name: "Line D",
    segments: [
      { type: "running", left: 0, width: 18 },
      { type: "delay", left: 18, width: 16 },
      { type: "change", left: 34, width: 10 },
      { type: "empty", left: 44, width: 18 },
      { type: "planned", left: 62, width: 16 },
    ],
  },
  {
    name: "Line E",
    segments: [
      { type: "running", left: 0, width: 28 },
      { type: "change", left: 28, width: 8 },
      { type: "running", left: 36, width: 24 },
      { type: "planned", left: 60, width: 26 },
    ],
  },
  {
    name: "Line F",
    segments: [
      { type: "running", left: 0, width: 20 },
      { type: "empty", left: 20, width: 14 },
      { type: "delay", left: 34, width: 14 },
      { type: "running", left: 48, width: 16 },
      { type: "planned", left: 64, width: 20 },
    ],
  },
];

const legend = [
  { label: "생산 중", type: "running" },
  { label: "예정", type: "planned" },
  { label: "셋업", type: "change" },
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
.dashboard-middle-grid {
  display: grid;
  grid-template-columns: minmax(560px, 1.35fr) minmax(420px, 1fr);
  gap: 14px;
}

@media (max-width: 1280px) {
  .dashboard-middle-grid {
    grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.9fr);
  }
}

@media (max-width: 900px) {
  .dashboard-middle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
