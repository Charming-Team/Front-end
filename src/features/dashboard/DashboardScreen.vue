<template>
  <div class="dashboard-page">
    <section v-if="loading" class="dashboard-state">대시보드 데이터를 불러오는 중입니다.</section>

    <section v-else-if="error" class="dashboard-state dashboard-state--error">
      <span>{{ error }}</span>
      <button type="button" @click="loadDashboard">다시 시도</button>
    </section>

    <template v-else>
      <DashboardMetricGrid :metrics="metrics" />

      <section class="dashboard-middle-grid mb-3">
        <ProductionSchedulePanel
          :base-week-start="baseWeekStart"
          :gantt-rows="ganttRows"
          :legend="legend"
          @week-change="loadWeeklySchedule"
        />
        <OrderStatusPanel
          :orders="orders"
          :average-rate="averageRate"
          @navigate="goToOrders"
        />
      </section>

      <UtilizationPanel :items="utilization" @navigate="goToLines" />
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import DashboardMetricGrid from "../../components/dashboard/DashboardMetricGrid.vue";
import OrderStatusPanel from "../../components/dashboard/OrderStatusPanel.vue";
import ProductionSchedulePanel from "../../components/dashboard/ProductionSchedulePanel.vue";
import UtilizationPanel from "../../components/dashboard/UtilizationPanel.vue";
import {
  fetchDashboardLineUtilization,
  fetchDashboardOrderDeliveryStatus,
  fetchDashboardSummary,
  fetchDashboardWeeklySchedule,
} from "./api.js";
import {
  dashboardLegend,
  mapLineUtilization,
  mapOrderDeliveryStatus,
  mapSummaryToMetrics,
  mapWeeklySchedule,
} from "./mapper.js";

const router = useRouter();

const metrics = ref([]);
const baseWeekStart = ref(new Date().toISOString().slice(0, 10));
const ganttRows = ref([]);
const legend = dashboardLegend;
const orders = ref([]);
const averageRate = ref(0);
const utilization = ref([]);
const activeLines = ref([]);
const loading = ref(false);
const error = ref("");

function goToOrders() {
  router.push("/orders");
}

function goToLines() {
  router.push("/lines");
}

function applyWeeklySchedule(scheduleResponse) {
  const schedule = mapWeeklySchedule(scheduleResponse, activeLines.value);
  baseWeekStart.value = schedule.baseWeekStart;
  ganttRows.value = schedule.rows;
}

async function loadWeeklySchedule(range = {}) {
  error.value = "";

  try {
    applyWeeklySchedule(await fetchDashboardWeeklySchedule(range));
  } catch (err) {
    error.value = err.message || "주간 생산 스케줄을 불러오지 못했습니다.";
  }
}

async function loadDashboard() {
  loading.value = true;
  error.value = "";

  try {
    const [summaryResponse, scheduleResponse, orderResponse, utilizationResponse] =
      await Promise.all([
        fetchDashboardSummary(),
        fetchDashboardWeeklySchedule(),
        fetchDashboardOrderDeliveryStatus({ limit: 5 }),
        fetchDashboardLineUtilization(),
      ]);

    metrics.value = mapSummaryToMetrics(summaryResponse);
    activeLines.value = utilizationResponse?.lines ?? [];
    applyWeeklySchedule(scheduleResponse);

    const orderStatus = mapOrderDeliveryStatus(orderResponse);
    orders.value = orderStatus.orders;
    averageRate.value = orderStatus.averageRate;

    utilization.value = mapLineUtilization(utilizationResponse);
  } catch (err) {
    error.value = err.message || "대시보드 데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 0;
}

.dashboard-state {
  display: grid;
  min-height: 240px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  color: var(--color-text-subtle);
  font-size: 14px;
  font-weight: 700;
}

.dashboard-state--error {
  gap: 10px;
  color: var(--color-danger-dark);
}

.dashboard-state button {
  border: 0;
  background: transparent;
  color: var(--color-primary);
  font-weight: 800;
}

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
