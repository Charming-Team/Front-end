<script setup>
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";

defineProps({
  items: { type: Array, default: () => [] },
});

const legendItems = [
  { key: "running", label: "생산 중", color: "#17a34a" },
  { key: "idle", label: "대기", color: "#2563eb" },
  { key: "stopped", label: "셋업", color: "#94a3b8" },
  { key: "error", label: "오류", color: "#ef4444" },
  { key: "maintenance", label: "점검", color: "#f59e0b" },
];

const statusLabelMap = Object.fromEntries(
  legendItems.map((item) => [item.key, item.label])
);

const statusColorMap = Object.fromEntries(
  legendItems.map((item) => [item.key, item.color])
);
</script>

<template>
  <AppCard class="section-card composition-card dashboard-panel">
    <AppSectionHeader class="section-header-shell" title="라인별 설비 가동 현황" />

    <div class="legend">
      <span v-for="legend in legendItems" :key="legend.key" class="legend-item">
        <i class="legend-dot" :style="{ backgroundColor: legend.color }"></i>
        {{ legend.label }}
      </span>
    </div>

    <div class="chart-list">
      <div v-for="line in items" :key="line.id" class="chart-row">
        <div class="chart-row__meta">
          <span class="chart-row__label">{{ line.name }}</span>
        </div>

        <div class="chart-row__bar">
          <div
            v-for="equipment in line.equipments"
            :key="`${line.id}-${equipment.name}`"
            class="chart-row__segment"
            :title="`${equipment.name} · ${statusLabelMap[equipment.status]}`"
            :style="{
              backgroundColor: statusColorMap[equipment.status],
            }"
          >
            <span class="chart-row__segment-label">{{ equipment.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.section-card {
  padding: 12px 20px 16px;
}

.composition-card {
  min-width: 0;
}

.dashboard-panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.section-header-shell {
  margin: 0 -20px 8px;
  padding: 0 26px 8px;
}

.legend {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 18px;
  padding: 2px 26px 14px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  min-width: 0;
}

.legend-dot {
  width: 13px;
  height: 13px;
  border-radius: 4px;
  display: inline-block;
}

.chart-list {
  display: grid;
  gap: 16px;
  padding: 2px 6px 0;
}

.chart-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.chart-row__meta {
  display: flex;
  align-items: center;
}

.chart-row__label {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.chart-row__bar {
  display: flex;
  width: 100%;
  height: 38px;
  border-radius: 999px;
  overflow: hidden;
  background: #eef2f6;
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);
}

.chart-row__segment {
  flex: 1 1 0;
  display: grid;
  align-content: center;
  justify-items: center;
  height: 100%;
  border-right: 1px solid rgba(255, 255, 255, 0.38);
  padding-inline: 4px;
  color: #ffffff;
  line-height: 1.05;
  overflow: hidden;
}

.chart-row__segment:last-child {
  border-right: 0;
}

.chart-row__segment-label {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-row__segment-label {
  font-size: 10px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .legend {
    gap: 12px;
    font-size: 11px;
  }

  .legend-dot {
    width: 11px;
    height: 11px;
  }
}

@media (max-width: 560px) {
  .section-card {
    padding: 12px 16px;
  }

  .section-header-shell {
    margin: 0 -16px 10px;
    padding: 0 16px 8px;
  }

  .chart-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .legend {
    justify-content: flex-start;
    overflow-x: auto;
    padding-inline: 16px;
  }
}
</style>
