<template>
  <section class="panel utilization-panel">
    <div class="panel-header compact">
      <h2>{{ title }}</h2>
      <a href="#">더보기 <span class="arrow"></span></a>
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
.panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.utilization-panel {
  padding-bottom: 24px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 25px 28px 0;
}

.panel-header.compact {
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.panel-header h2 {
  margin: 0;
  color: var(--color-text-main);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.panel-header a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-main);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.arrow {
  width: 7px;
  height: 7px;
  display: inline-block;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(160px, 1fr));
  gap: 18px;
  padding: 0 24px;
}

@media (max-width: 1600px) {
  .gauge-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }
}

@media (max-width: 1280px) {
  .gauge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .gauge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
