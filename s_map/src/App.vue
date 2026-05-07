<script setup>
import logo from './assets/logo.png'
import logoMain from './assets/logo_main.png'

const navItems = [
  { label: '대시보드', anchor: '#dashboard', active: true },
  { label: '주문 관리', anchor: '#delivery' },
  { label: '생산계획', anchor: '#production' },
  { label: '자재 현황', anchor: '#dashboard' },
  { label: '라인 현황', anchor: '#utilization' },
  { label: '리스크 분석', anchor: '#dashboard' },
  { label: '보고서', anchor: '#dashboard' },
]

const summaryCards = [
  { label: '지연 위험 주문', value: '18', unit: '건', tone: 'alert' },
  { label: '자재 부족 품목', value: '2', unit: '건', tone: 'sky' },
  { label: '주문별 달성률', value: '98', unit: '%', tone: 'teal' },
  { label: '생산계획 절약비용', value: '37', unit: '일', tone: 'indigo' },
]

const timeMarks = ['08:00', '11:30', '15:00', '18:30', '22:00']

const scheduleRows = [
  {
    name: 'Line A',
    segments: [
      { width: 22, type: 'planned' },
      { width: 24, type: 'running' },
      { width: 10, type: 'transition' },
      { width: 28, type: 'running' },
    ],
  },
  {
    name: 'Line B',
    segments: [
      { width: 18, type: 'planned' },
      { width: 28, type: 'running' },
      { width: 10, type: 'transition' },
      { width: 16, type: 'running' },
    ],
  },
  {
    name: 'Line C',
    segments: [
      { width: 12, type: 'planned' },
      { width: 24, type: 'running' },
      { width: 11, type: 'transition' },
      { width: 28, type: 'running' },
    ],
  },
  {
    name: 'Line D',
    segments: [
      { width: 14, type: 'transition' },
      { width: 20, type: 'delay' },
      { width: 18, type: 'running' },
      { width: 8, type: 'planned' },
    ],
  },
]

const ganttLegend = [
  { label: '계획', type: 'planned' },
  { label: '진행', type: 'running' },
  { label: '전환', type: 'transition' },
  { label: '지연', type: 'delay' },
]

const orderDelivery = [
  { code: 'Line A', progress: 70, daysLeft: 4, color: '#11a7a7' },
  { code: 'Line B', progress: 30, daysLeft: 7, color: '#f0042f' },
  { code: 'Line C', progress: 50, daysLeft: 5, color: '#95c900' },
  { code: 'Line D', progress: 75, daysLeft: 3, color: '#196fb1' },
  { code: 'Line E', progress: 80, daysLeft: 2, color: '#11a7a7' },
]

const lineUtilization = [
  { name: 'Line A', actual: 80, target: 88, color: '#196fb1' },
  { name: 'Line B', actual: 50, target: 72, color: '#11a7a7' },
  { name: 'Line C', actual: 60, target: 78, color: '#196fb1' },
  { name: 'Line D', actual: 70, target: 84, color: '#11a7a7' },
]

const orderMinDays = Math.min(...orderDelivery.map((item) => item.daysLeft))
const orderMaxDays = Math.max(...orderDelivery.map((item) => item.daysLeft))
const orderChartWidth = 560
const orderPointOffset = 56
const orderPointStep = 112

const orderTrendNodes = orderDelivery.map((item, index) => {
  const spread = orderMaxDays - orderMinDays || 1
  const x = orderPointOffset + index * orderPointStep
  const y = 16 + ((item.daysLeft - orderMinDays) / spread) * 96

  return { ...item, x, y }
})

const orderTrendPoints = orderTrendNodes.map(({ x, y }) => `${x},${y}`).join(' ')
</script>

<template>
  <div class="app-shell">
    <div class="layout-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img :src="logo" alt="S-MAP" class="brand-logo" />
        </div>

        <nav class="side-nav">
          <a
            v-for="item in navItems"
            :key="item.label"
            :href="item.anchor"
            :class="['side-link', { active: item.active }]"
          >
            {{ item.label }}
          </a>
        </nav>

        <div class="sidebar-orbit"></div>
      </aside>

      <main class="dashboard-main" id="dashboard">
        <img :src="logoMain" alt="" aria-hidden="true" class="dashboard-mark" />

        <section class="summary-grid row g-3 g-xxl-4">
          <div v-for="card in summaryCards" :key="card.label" class="col-12 col-sm-6 col-xxl-3">
            <article :class="['summary-card', card.tone, 'h-100']">
              <p>{{ card.label }}</p>
              <div class="summary-value">
                <strong>{{ card.value }}</strong>
                <span>{{ card.unit }}</span>
              </div>
            </article>
          </div>
        </section>

        <section class="panel panel-wide" id="production">
          <div class="panel-heading">
            <h2>생산 스케줄 / 간트 차트</h2>
            <div class="legend-row">
              <span v-for="item in ganttLegend" :key="item.label" class="legend-item">
                <i :class="['legend-swatch', `segment-${item.type}`]"></i>
                {{ item.label }}
              </span>
            </div>
          </div>

          <div class="timeline-ruler">
            <span v-for="time in timeMarks" :key="time">{{ time }}</span>
          </div>

          <div class="gantt-board">
            <div v-for="line in scheduleRows" :key="line.name" class="gantt-row">
              <strong class="gantt-line-name">{{ line.name }}</strong>

              <div class="gantt-track">
                <span
                  v-for="(segment, index) in line.segments"
                  :key="`${line.name}-${segment.type}-${segment.width}-${index}`"
                  :class="['gantt-segment', `segment-${segment.type}`]"
                  :style="{ width: `${segment.width}%` }"
                ></span>
              </div>
            </div>
          </div>
        </section>

        <section class="analytics-grid row g-3 g-xxl-4">
          <div class="col-12 col-xl-6">
            <article class="panel chart-panel h-100" id="delivery">
              <div class="chart-title-row">
                <h2>주문 및 납기 현황</h2>
                <div class="chart-legend">
                  <span><i class="legend-line"></i>납기일</span>
                  <span><i class="legend-bar"></i>진행률</span>
                </div>
              </div>

              <div class="order-chart-shell">
                <span class="axis-arrow axis-vertical"></span>

                <svg
                  class="order-trend"
                  :viewBox="`0 0 ${orderChartWidth} 120`"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polyline class="order-trend-line" :points="orderTrendPoints" />
                  <circle
                    v-for="node in orderTrendNodes"
                    :key="`${node.code}-point`"
                    :cx="node.x"
                    :cy="node.y"
                    r="5"
                    class="order-trend-point"
                  />
                </svg>

                <div class="order-columns">
                  <div v-for="order in orderDelivery" :key="order.code" class="order-column">
                    <div class="order-bar-track">
                      <div class="order-bar-fill" :style="{ height: `${order.progress}%`, background: order.color }">
                        <span>{{ order.progress }}%</span>
                      </div>
                    </div>
                    <strong class="order-code">{{ order.code }}</strong>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div class="col-12 col-xl-6">
            <article class="panel chart-panel h-100" id="utilization">
              <div class="chart-title-row">
                <h2>라인별 가동 현황</h2>
                <div class="chart-legend">
                  <span><i class="legend-bar"></i>가동률</span>
                </div>
              </div>

              <div class="utilization-shell">
                <span class="axis-arrow axis-vertical"></span>

                <div class="utilization-list">
                  <div v-for="line in lineUtilization" :key="line.name" class="utilization-row">
                    <strong class="utilization-name">{{ line.name }}</strong>

                    <div class="utilization-track-shell">
                      <span
                        class="utilization-target-marker"
                        :style="{ left: `min(${line.target}%, calc(100% - 8px))` }"
                      ></span>
                      <div class="utilization-track">
                        <span
                          class="utilization-fill"
                          :style="{ width: `${line.actual}%`, background: line.color }"
                        ></span>
                      </div>
                    </div>

                    <div class="utilization-value">{{ line.actual }}%</div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>

    <button type="button" class="chatbot-button">챗봇</button>
  </div>
</template>
