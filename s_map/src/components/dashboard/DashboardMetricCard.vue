<template>
  <article class="metric-card">
    <h2>{{ metric.title }}</h2>
    <div class="metric-value">
      {{ metric.value }}
      <span>{{ metric.unit }}</span>
    </div>
    <div v-if="metric.caption" class="metric-caption">
      <span>{{ metric.caption }}</span>
      <strong :class="metric.tone">{{ metric.change }}</strong>
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
  min-height: 164px;
  padding: 23px 34px 22px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.metric-card h2 {
  margin: 0 0 12px;
  color: var(--color-text-main);
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.1px;
}

.metric-value {
  display: flex;
  align-items: flex-end;
  gap: 13px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-main);
  font-size: 50px;
  line-height: 0.95;
  font-weight: 800;
}

.metric-value span {
  margin-bottom: 8px;
  font-size: 18px;
  line-height: 1;
  font-weight: 700;
}

.metric-caption {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 14px;
  font-size: 16px;
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
