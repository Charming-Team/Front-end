<template>
  <section class="metric-grid" aria-label="주요 지표">
    <DashboardMetricCard
      v-for="metric in metrics"
      :key="metric.title"
      :metric="metric"
    />
  </section>
</template>

<script setup>
import DashboardMetricCard from "./DashboardMetricCard.vue";

defineProps({
  metrics: {
    type: Array,
    default: () => [],
  },
});
</script>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

@media (max-width: 1280px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
