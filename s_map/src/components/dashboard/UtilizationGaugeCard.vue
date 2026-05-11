<template>
  <article class="gauge-card">
    <h3>
      <span :class="line.low ? 'orange-dot' : 'green-dot'"></span>
      {{ line.name }}
    </h3>
    <div class="gauge" :class="{ low: line.low }">
      <svg class="gauge-svg" viewBox="0 0 180 110" aria-hidden="true">
        <path class="gauge-track" d="M25 92 A65 65 0 0 1 155 92" />
        <path
          class="gauge-progress"
          d="M25 92 A65 65 0 0 1 155 92"
          :pathLength="100"
          :style="{ strokeDasharray: `${line.value} 100` }"
        />
      </svg>
      <div class="gauge-center">
        <strong>{{ line.value }}%</strong>
      </div>
      <b class="gauge-status">{{ line.low ? "가동 저조" : "가동 중" }}</b>
    </div>
  </article>
</template>

<script setup>
defineProps({
  line: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.gauge-card {
  min-height: 168px;
  padding: 18px 14px 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.gauge-card h3 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
}

.green-dot,
.orange-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
}

.green-dot {
  background: var(--color-success);
}

.orange-dot {
  background: var(--color-warning);
}

.gauge {
  position: relative;
  width: 160px;
  height: 108px;
  margin: 10px auto 0;
}

.gauge-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gauge-track,
.gauge-progress {
  fill: none;
  stroke-linecap: round;
  stroke-width: 9;
}

.gauge-track {
  stroke: var(--color-track);
}

.gauge-progress {
  stroke: var(--color-success);
}

.gauge.low .gauge-progress {
  stroke: var(--color-warning);
}

.gauge-center {
  position: absolute;
  left: 50%;
  top: 50px;
  width: 116px;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1;
}

.gauge-center strong {
  display: block;
  color: var(--color-navy);
  font-size: 24px;
  line-height: 1.05;
  font-weight: 800;
}

.gauge-center b {
  display: block;
}

.gauge-status {
  position: absolute;
  left: 0;
  right: 0;
  top: 77px;
  color: var(--color-success);
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.gauge.low .gauge-status {
  color: var(--color-warning);
}
</style>
