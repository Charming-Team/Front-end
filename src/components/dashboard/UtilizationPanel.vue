<template>
  <section class="card utilization-panel dashboard-panel">
    <div
      class="panel-header d-flex justify-content-between align-items-center gap-3"
    >
      <button class="panel-title-button" type="button" @click="emit('navigate')">
        <h2 class="panel-title mb-0">{{ title }}</h2>
      </button>
      <PanelMoreButton @click="emit('navigate')" />
    </div>

    <div class="gauge-grid">
      <UtilizationGaugeCard
        v-for="line in items"
        :key="line.name"
        :line="line"
      />
    </div>
  </section>
</template>

<script setup>
import UtilizationGaugeCard from "./UtilizationGaugeCard.vue";
import PanelMoreButton from "../common/PanelMoreButton.vue";

const emit = defineEmits(["navigate"]);

defineProps({
  title: {
    type: String,
    default: "라인별 가동 현황",
  },
  items: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.dashboard-panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.utilization-panel {
  padding-bottom: 14px;
}

.panel-header {
  min-height: 46px;
  padding: 12px 26px 8px;
}

.panel-title {
  color: var(--color-text-main);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.panel-title-button {
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
}

.panel-title-button:not(:disabled) {
  cursor: pointer;
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 12px;
  padding: 0 26px;
}

@media (max-width: 1180px) {
  .gauge-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (max-width: 900px) {
  .gauge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .gauge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
