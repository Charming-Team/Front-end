<template>
  <section class="row g-3 mb-3" aria-label="주요 지표">
    <DashboardMetricCard
      v-for="metric in metrics"
      :key="metric.title"
      class="col-12 col-md-6 col-lg-3"
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
