<template>
  <section class="metric-grid" aria-label="주요 지표">
    <article v-for="metric in metrics" :key="metric.title" class="metric-card">
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
  </section>

  <section class="middle-grid">
    <article class="panel schedule-panel">
      <div class="panel-header">
        <h2>생산 스케줄</h2>
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

      <div class="schedule-date">2024년 5월 3주차</div>
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

    <article class="panel orders-panel">
      <div class="panel-header compact">
        <h2>주문 및 납기 현황</h2>
        <a href="#">더보기 <span class="arrow"></span></a>
      </div>

      <div class="order-table">
        <div class="table-head">
          <span>주문번호</span>
          <span>납기일</span>
          <span>진행률</span>
          <span>상태</span>
        </div>
        <div v-for="order in orders" :key="order.id" class="table-row">
          <strong>{{ order.id }}</strong>
          <span>{{ order.due }}</span>
          <div class="progress-cell">
            <span class="progress-track">
              <i
                :class="order.delayed ? 'danger' : 'success'"
                :style="{ width: `${order.progress}%` }"
              ></i>
            </span>
            <b>{{ order.progress }}%</b>
          </div>
          <span class="status" :class="{ delayed: order.delayed }">
            {{ order.delayed ? "지연" : "진행 중" }}
          </span>
        </div>
      </div>

      <div class="order-average">
        <div>
          <span>전체 평균 가동률</span>
          <strong>58%</strong>
        </div>
        <div class="average-track">
          <i></i>
        </div>
      </div>
    </article>
  </section>

  <section class="panel utilization-panel">
    <div class="panel-header compact">
      <h2>라인별 가동 현황</h2>
      <a href="#">더보기 <span class="arrow"></span></a>
    </div>

    <div class="gauge-grid">
      <article v-for="line in utilization" :key="line.name" class="gauge-card">
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
            <span>{{ line.value }} / 100%</span>
            <b>{{ line.low ? "가동 저조" : "가동 중" }}</b>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
const metrics = [
  {
    title: "지연 위험 주문",
    value: "18",
    unit: "건",
    caption: "전체 주문 대비",
    change: "8%",
    tone: "danger",
  },
  {
    title: "자재 부족 품목",
    value: "2",
    unit: "건",
    caption: "전체 품목 대비",
    change: "3%",
    tone: "warning",
  },
  {
    title: "주문별 달성률",
    value: "98",
    unit: "%",
    caption: "목표 대비",
    change: "98%",
    tone: "success",
  },
  { title: "생산계획 절약비용", value: "37", unit: "일" },
];

const weekTimeline = [
  "월 05.20",
  "화 05.21",
  "수 05.22",
  "목 05.23",
  "금 05.24",
  "토 05.25",
  "일 05.26",
];

const ganttRows = [
  {
    name: "Line A",
    segments: [
      { type: "planned", left: 0, width: 17 },
      { type: "running", left: 17, width: 22 },
      { type: "change", left: 39, width: 7 },
      { type: "running", left: 46, width: 42 },
    ],
  },
  {
    name: "Line B",
    segments: [
      { type: "planned", left: 0, width: 12 },
      { type: "running", left: 12, width: 27 },
      { type: "change", left: 39, width: 13 },
      { type: "running", left: 52, width: 18 },
    ],
  },
  {
    name: "Line C",
    segments: [
      { type: "planned", left: 0, width: 7 },
      { type: "running", left: 7, width: 32 },
      { type: "change", left: 39, width: 9 },
      { type: "running", left: 48, width: 30 },
    ],
  },
  {
    name: "Line D",
    segments: [
      { type: "change", left: 0, width: 13 },
      { type: "delay", left: 13, width: 13 },
      { type: "running", left: 26, width: 22 },
      { type: "empty", left: 48, width: 12 },
    ],
  },
];

const legend = [
  { label: "계획", type: "planned" },
  { label: "진행", type: "running" },
  { label: "전환", type: "change" },
  { label: "지연", type: "delay" },
  { label: "비가동", type: "empty" },
];

const orders = [
  { id: "PO-240520-001", due: "05.22 (수)", progress: 72 },
  { id: "PO-240520-002", due: "05.23 (목)", progress: 30, delayed: true },
  { id: "PO-240520-003", due: "05.24 (금)", progress: 50 },
  { id: "PO-240520-004", due: "05.25 (토)", progress: 90 },
  { id: "PO-240520-005", due: "05.26 (일)", progress: 20, delayed: true },
];

const utilization = [
  { name: "Line A", value: 80 },
  { name: "Line B", value: 55 },
  { name: "Line C", value: 60 },
  { name: "Line D", value: 36, low: true },
];
</script>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

.metric-card,
.panel,
.gauge-card {
  border: 1px solid var(--color-border);
  background: var(--color-panel);
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
}

.metric-card {
  min-height: 164px;
  padding: 23px 34px 22px;
  border-radius: 8px;
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

.middle-grid {
  display: grid;
  grid-template-columns: minmax(560px, 1.35fr) minmax(420px, 1fr);
  gap: 18px;
  margin-bottom: 18px;
}

.panel {
  border-radius: 8px;
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
  border-radius: 0;
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

.order-table {
  font-size: 15px;
  font-weight: 600;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.25fr 0.95fr 1.45fr 0.8fr;
  align-items: center;
  gap: 16px;
  padding: 0 31px;
}

.table-head {
  height: 52px;
  color: var(--color-navy);
}

.table-row {
  min-height: 57px;
  border-top: 1px solid var(--color-track-light);
}

.table-row strong,
.table-row span,
.progress-cell b {
  color: var(--color-navy);
}

.progress-cell {
  display: flex;
  align-items: center;
  gap: 18px;
}

.progress-track {
  width: 126px;
  height: 10px;
  border-radius: 999px;
  background: var(--color-track);
  overflow: hidden;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.progress-track .success {
  background: var(--color-success);
}

.progress-track .danger {
  background: var(--color-danger);
}

.status {
  width: 78px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  background: var(--color-success-bg);
  color: var(--color-success);
  font-size: 15px;
}

.status.delayed {
  background: var(--color-danger-bg);
  color: var(--color-danger-dark);
}

.order-average {
  margin: 14px 31px 22px;
  padding: 13px 16px;
  border-top: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-bg-soft);
}

.order-average div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
  color: var(--color-text-subtle);
  font-size: 14px;
  font-weight: 600;
}

.order-average strong {
  color: var(--color-navy);
  font-size: 18px;
  font-weight: 750;
}

.average-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-track);
}

.average-track i {
  display: block;
  width: 58%;
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}

.utilization-panel {
  padding-bottom: 24px;
}

.gauge-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  padding: 0 24px;
}

.gauge-card {
  min-height: 186px;
  border-radius: 8px;
  padding: 20px 18px 16px;
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
  width: 180px;
  height: 118px;
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
  top: 42px;
  width: 126px;
  transform: translateX(-50%);
  text-align: center;
  z-index: 1;
}

.gauge-center strong {
  display: block;
  color: var(--color-navy);
  font-size: 26px;
  line-height: 1.05;
  font-weight: 800;
}

.gauge-center span {
  display: block;
  margin-top: 8px;
  color: var(--color-navy);
  font-size: 15px;
  font-weight: 600;
}

.gauge-center b {
  display: block;
  margin-top: 8px;
  color: var(--color-success);
  font-size: 16px;
  font-weight: 700;
}

.gauge.low .gauge-center b {
  color: var(--color-warning);
}

@media (max-width: 1280px) {
  .middle-grid,
  .metric-grid,
  .gauge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .metric-grid,
  .middle-grid,
  .gauge-grid {
    grid-template-columns: 1fr;
  }

  .middle-grid {
    gap: 18px;
  }

  .schedule-panel {
    overflow-x: auto;
  }

  .schedule-panel > * {
    min-width: 720px;
  }
}
</style>
