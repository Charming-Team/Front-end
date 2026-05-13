<template>
  <article class="card schedule-panel dashboard-panel">
    <div class="card-body p-0">
      <div class="panel-header d-flex justify-content-between align-items-center gap-3">
        <h2 class="panel-title mb-0">{{ title }}</h2>
        <div class="btn-group panel-actions" role="group" aria-label="생산 스케줄 주차 이동">
          <button class="btn btn-light" type="button" @click="goToday">오늘</button>
          <button class="btn btn-light square-button" type="button" aria-label="이전 주" @click="moveWeek(-1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button class="btn btn-light square-button" type="button" aria-label="다음 주" @click="moveWeek(1)">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div class="schedule-date text-center fw-bold">{{ currentScheduleDate }}</div>
      <div class="timeline-labels">
        <span v-for="day in currentWeekTimeline" :key="day">{{ day }}</span>
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

      <div class="legend d-flex justify-content-center flex-wrap gap-4 px-4 pb-4">
        <span v-for="item in legend" :key="item.label" class="d-inline-flex align-items-center gap-2">
          <i :class="item.type"></i>
          {{ item.label }}
        </span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    default: "생산 스케줄",
  },
  baseWeekStart: {
    type: String,
    default: "2024-05-20",
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

const weekOffset = ref(0);
const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

const formatMonthDay = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
};

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const getMonday = (date) => {
  const monday = new Date(date);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const baseMonday = computed(() => getMonday(new Date(props.baseWeekStart)));

const currentMonday = computed(() => addDays(baseMonday.value, weekOffset.value * 7));

const currentWeekTimeline = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const date = addDays(currentMonday.value, index);
    return `${dayLabels[date.getDay()]} ${formatMonthDay(date)}`;
  }),
);

const currentScheduleDate = computed(() => {
  const start = currentMonday.value;
  const end = addDays(start, 6);
  return `${start.getFullYear()}년 ${formatMonthDay(start)} - ${formatMonthDay(end)}`;
});

const moveWeek = (amount) => {
  weekOffset.value += amount;
};

const goToday = () => {
  const todayMonday = getMonday(new Date());
  const diffDays = Math.round((todayMonday - baseMonday.value) / 86400000);
  weekOffset.value = Math.round(diffDays / 7);
};
</script>

<style scoped>
.dashboard-panel {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
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

.panel-actions button {
  height: 30px;
  border: 1px solid var(--color-border-strong);
  background: var(--color-panel);
  color: var(--color-text-main);
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(18, 34, 64, 0.04);
}

.square-button {
  width: 30px;
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
  margin: 5px 0;
  font-size: 13px;
}

.timeline-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-left: 112px;
  padding-right: 26px;
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 650;
}

.gantt {
  position: relative;
  margin: 5px 26px 0;
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
  min-height: 32px;
  border-bottom: 1px solid var(--color-border);
}

.gantt-row strong {
  font-size: 12px;
  font-weight: 700;
}

.bar-track {
  position: relative;
  height: 17px;
}

.bar-segment {
  position: absolute;
  top: 0;
  bottom: 0;
}

.planned {
  background: #a9cdee;
}

.running {
  background: #00897b;
}

.change {
  background: #b8c0cc;
}

.delay {
  background: #e53935;
}

.empty {
  background: repeating-linear-gradient(
    -45deg,
    #b8c0cc 0,
    #b8c0cc 3px,
    #eef2f6 3px,
    #eef2f6 8px
  );
}

.legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 7px 26px 10px;
  font-size: 12px;
  font-weight: 600;
}

.legend span {
  display: inline-flex;
  align-items: center;
  gap: 11px;
}

.legend i {
  width: 13px;
  height: 13px;
  border-radius: 4px;
  display: inline-block;
}

.legend i.planned {
  background: #a9cdee;
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
