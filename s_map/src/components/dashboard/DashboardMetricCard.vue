<template>
  <article>
    <div class="metric-card card h-100 border-0">
      <div class="card-body">
        <h2 class="card-title mb-2">{{ metric.title }}</h2>
        <div class="metric-value d-flex align-items-end gap-2 border-bottom pb-2">
          {{ metric.value }}
          <span class="mb-1">{{ metric.unit }}</span>
        </div>
        <div
          v-if="metric.caption"
          class="d-flex align-items-center gap-3 mt-2 metric-caption"
        >
          <span>{{ metric.caption }}</span>
          <strong :class="metric.tone">{{ metric.change }}</strong>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  metric: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.metric-card {
  min-height: 92px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.card-body {
  padding: 11px 20px;
}

.card-title {
  color: var(--color-text-main);
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.1px;
}

.metric-value {
  color: var(--color-text-main);
  font-size: 25px;
  line-height: 0.95;
  font-weight: 800;
}

.metric-value span {
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
}

.metric-caption {
  font-size: 12px;
  font-weight: 600;
}

.metric-caption .danger {
  color: var(--color-danger);
}

.metric-caption .warning {
  color: var(--color-warning);
}

.metric-caption .success {
  color: var(--color-success);
}
</style>
