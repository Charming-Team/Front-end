<template>
  <article class="card gauge-card">
    <div class="card-body p-3">
      <h3 class="d-flex align-items-center gap-2 mb-1">
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
  min-height: 128px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.gauge-card h3 {
  font-size: 13px;
  font-weight: 700;
}

.green-dot,
.orange-dot {
  width: 10px;
  height: 10px;
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
  width: 124px;
  height: 84px;
  margin: 6px auto 0;
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
  stroke-width: 8;
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
  top: 38px;
  width: 96px;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1;
}

.gauge-center strong {
  display: block;
  color: var(--color-navy);
  font-size: 20px;
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
  top: 61px;
  color: var(--color-success);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.gauge.low .gauge-status {
  color: var(--color-warning);
}
</style>
