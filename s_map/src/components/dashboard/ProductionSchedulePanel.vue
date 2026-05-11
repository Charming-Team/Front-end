<template>
  <article class="panel schedule-panel">
    <div class="panel-header">
      <h2>{{ title }}</h2>
      <div class="panel-actions">
        <button type="button">오늘</button>
        <button class="square-button" type="button" aria-label="이전">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button class="square-button" type="button" aria-label="다음">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>

    <div class="schedule-date">{{ scheduleDate }}</div>
    <div class="timeline-labels">
      <span v-for="day in weekTimeline" :key="day">{{ day }}</span>
    </div>

    <div class="gantt">
      <div v-for="line in ganttRows" :key="line.name" class="gantt-row">
        <strong>{{ line.name }}</strong>
        <div class="bar-track">
          <span
            v-for="(segment, index) in line.segments"
            :key="`${line.name}-${index}`"
            class="bar-segment"
            :class="segment.type"
            :style="{ left: `${segment.left}%`, width: `${segment.width}%` }"
          ></span>
        </div>
      </div>
    </div>

    <div class="legend">
      <span v-for="item in legend" :key="item.label">
        <i :class="item.type"></i>
        {{ item.label }}
      </span>
    </div>
  </article>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "생산 스케줄",
  },
  scheduleDate: {
    type: String,
    default: "",
  },
  weekTimeline: {
    type: Array,
    default: () => [],
  },
  ganttRows: {
    type: Array,
    default: () => [],
  },
  legend: {
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 25px 28px 0;
}

.panel-header h2 {
  margin: 0;
  color: var(--color-text-main);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-actions button {
  height: 45px;
  padding: 0 17px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--color-border-strong);
  border-radius: 8px;
  background: var(--color-panel);
  color: var(--color-text-main);
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(18, 34, 64, 0.04);
}

.panel-actions .square-button {
  width: 45px;
  padding: 0;
  justify-content: center;
}

.square-button svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.schedule-date {
  margin: 17px 0 14px;
  text-align: center;
  font-size: 18px;
  font-weight: 700;
}

.timeline-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-left: 112px;
  padding-right: 26px;
  color: var(--color-text-subtle);
  font-size: 14px;
  font-weight: 650;
}

.gantt {
  position: relative;
  margin: 16px 26px 0;
  overflow: hidden;
}

.gantt::before {
  content: "";
  position: absolute;
  left: 112px;
  right: 0;
  top: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    to right,
    transparent 0,
    transparent calc(14.285% - 1px),
    var(--color-track-light) calc(14.285% - 1px),
    var(--color-track-light) 14.285%
  );
  pointer-events: none;
}

.gantt-row {
  position: relative;
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: 22px;
  min-height: 62px;
  border-bottom: 1px solid var(--color-border);
}

.gantt-row strong {
  font-size: 16px;
  font-weight: 700;
}

.bar-track {
  position: relative;
  height: 31px;
}

.bar-segment {
  position: absolute;
  top: 0;
  bottom: 0;
}

.planned {
  background: var(--color-primary);
}

.running {
  background: var(--color-success);
}

.change {
  background: var(--color-track-strong);
}

.delay {
  background: var(--color-danger);
}

.empty {
  background: repeating-linear-gradient(
    -45deg,
    var(--color-track-light) 0,
    var(--color-track-light) 2px,
    var(--color-bg-soft) 2px,
    var(--color-bg-soft) 4px
  );
}

.legend {
  display: flex;
  justify-content: center;
  gap: 38px;
  padding: 15px 24px 24px;
  font-size: 15px;
  font-weight: 600;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 11px;
}

.legend i {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: inline-block;
}

@media (max-width: 900px) {
  .schedule-panel {
    overflow-x: auto;
  }

  .schedule-panel > * {
    min-width: 720px;
  }
}
</style>
