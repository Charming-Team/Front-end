<template>
  <div class="dashboard-page">
    <aside class="sidebar">
      <div class="brand">
        <img class="brand-logo" :src="logoSymbol" alt="" />
        <span>S-MAP</span>
      </div>

      <nav class="nav-list" aria-label="Main navigation">
        <a
          v-for="item in navigation"
          :key="item.label"
          class="nav-item"
          :class="{ active: item.active }"
          href="#"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </a>
        <RouterLink to="/register" class="nav-item">
          <span class="nav-icon" v-html="icons.register"></span>
          <span>사용자 등록</span>
        </RouterLink>
      </nav>

      <button class="nav-item logout-item" type="button" @click="logout">
        <span class="nav-icon" v-html="icons.logout"></span>
        <span>로그아웃</span>
      </button>

    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <h1>대시보드</h1>
          <p>실시간 운영 현황을 한눈에 확인하세요.</p>
        </div>

        <div class="top-actions">
          <button class="icon-button notification-button" type="button" aria-label="알림">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
            <span>15</span>
          </button>
          <div class="user-menu">
            <span class="avatar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            관리자
            <span class="chevron"></span>
          </div>
        </div>
      </header>

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
                  <i :class="order.delayed ? 'danger' : 'success'" :style="{ width: `${order.progress}%` }"></i>
                </span>
                <b>{{ order.progress }}%</b>
              </div>
              <span class="status" :class="{ delayed: order.delayed }">
                {{ order.delayed ? '지연' : '진행 중' }}
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
                <b>{{ line.low ? '가동 저조' : '가동 중' }}</b>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>

    <button class="chatbot-button" type="button" aria-label="챗봇">
      <span class="chat-bubble">
        <i></i>
        <i></i>
        <i></i>
      </span>
      챗봇
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { clearToken } from '../utils/storage.js'
import logoSymbol from '../assets/logo.png'

const router = useRouter()
function logout() { clearToken(); router.push('/login') }

const baseIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </svg>
`

const icons = {
  dashboard: baseIcon,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>`,
  plan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z" /><path d="m9 12 2 2 4-5" /></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z" /><path d="m8 8 4-4 4 4" /></svg>`,
  line: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4ZM14 5h6v6h-6ZM4 15h6v4H4ZM14 15h6v4h-6Z" /></svg>`,
  risk: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 10 17H2L12 4Z" /><path d="M12 10v5M12 18h.01" /></svg>`,
  report: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5Z" /><path d="M8 9h8M8 13h5M16 14l2 2 3-4" /></svg>`,
  register: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>`,
}

const navigation = [
  { label: '대시보드', icon: icons.dashboard, active: true },
  { label: '주문 관리', icon: icons.calendar },
  { label: '생산계획', icon: icons.plan },
  { label: '자재 현황', icon: icons.box },
  { label: '라인 현황', icon: icons.line },
  { label: '리스크 분석', icon: icons.risk },
  { label: '보고서', icon: icons.report },
]

const metrics = [
  { title: '지연 위험 주문', value: '18', unit: '건', caption: '전체 주문 대비', change: '8%', tone: 'danger' },
  { title: '자재 부족 품목', value: '2', unit: '건', caption: '전체 품목 대비', change: '3%', tone: 'warning' },
  { title: '주문별 달성률', value: '98', unit: '%', caption: '목표 대비', change: '98%', tone: 'success' },
  { title: '생산계획 절약비용', value: '37', unit: '일' },
]

const weekTimeline = ['월 05.20', '화 05.21', '수 05.22', '목 05.23', '금 05.24', '토 05.25', '일 05.26']

const ganttRows = [
  {
    name: 'Line A',
    segments: [
      { type: 'planned', left: 0, width: 17 },
      { type: 'running', left: 17, width: 22 },
      { type: 'change', left: 39, width: 7 },
      { type: 'running', left: 46, width: 42 },
    ],
  },
  {
    name: 'Line B',
    segments: [
      { type: 'planned', left: 0, width: 12 },
      { type: 'running', left: 12, width: 27 },
      { type: 'change', left: 39, width: 13 },
      { type: 'running', left: 52, width: 18 },
    ],
  },
  {
    name: 'Line C',
    segments: [
      { type: 'planned', left: 0, width: 7 },
      { type: 'running', left: 7, width: 32 },
      { type: 'change', left: 39, width: 9 },
      { type: 'running', left: 48, width: 30 },
    ],
  },
  {
    name: 'Line D',
    segments: [
      { type: 'change', left: 0, width: 13 },
      { type: 'delay', left: 13, width: 13 },
      { type: 'running', left: 26, width: 22 },
      { type: 'empty', left: 48, width: 12 },
    ],
  },
]

const legend = [
  { label: '계획', type: 'planned' },
  { label: '진행', type: 'running' },
  { label: '전환', type: 'change' },
  { label: '지연', type: 'delay' },
  { label: '비가동', type: 'empty' },
]

const orders = [
  { id: 'PO-240520-001', due: '05.22 (수)', progress: 72 },
  { id: 'PO-240520-002', due: '05.23 (목)', progress: 30, delayed: true },
  { id: 'PO-240520-003', due: '05.24 (금)', progress: 50 },
  { id: 'PO-240520-004', due: '05.25 (토)', progress: 90 },
  { id: 'PO-240520-005', due: '05.26 (일)', progress: 20, delayed: true },
]

const utilization = [
  { name: 'Line A', value: 80 },
  { name: 'Line B', value: 55 },
  { name: 'Line C', value: 60 },
  { name: 'Line D', value: 36, low: true },
]
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  background: #F8FAFC;
  color: #0D1F3C;
  font-family:
    "Pretendard Variable", Pretendard, "Noto Sans KR", Inter, -apple-system, BlinkMacSystemFont,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  word-break: keep-all;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0D1F3C;
  color: #ffffff;
  box-shadow: 12px 0 32px rgba(13,31,60,0.4);
}

.brand {
  height: 122px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 30px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0;
}

.brand-logo {
  width: 46px;
  height: 46px;
  display: block;
  flex: 0 0 auto;
  object-fit: contain;
  padding: 5px;
  border-radius: 8px;
  background: #fff;
}

.nav-list {
  display: flex;
  flex-direction: column;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  height: 74px;
  padding: 0 34px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: -0.1px;
}

.nav-item.active {
  background: #1565C0;
  color: #ffffff;
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 9px;
  background: #4A9EFF;
}

.nav-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
}

.nav-icon :deep(svg),
.top-actions svg,
.square-button svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.main-content {
  min-width: 0;
  padding: 28px 54px 34px 24px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}

.topbar h1 {
  margin: 0 0 8px;
  color: #0D1F3C;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.topbar p {
  margin: 0;
  color: #4A5568;
  font-size: 17px;
  font-weight: 500;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 22px;
}

.date-button,
.panel-actions button,
.icon-button {
  height: 54px;
  border: 1px solid #CBD5E0;
  border-radius: 8px;
  background: #ffffff;
  color: #0D1F3C;
  font-weight: 600;
  box-shadow: 0 6px 18px rgba(18, 34, 64, 0.04);
}

.date-button {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 0 18px;
  font-size: 17px;
}

.date-button svg,
.icon-button svg,
.avatar svg {
  width: 27px;
  height: 27px;
}

.chevron {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
}

.icon-button {
  position: relative;
  width: 42px;
  height: 42px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.notification-button span {
  position: absolute;
  top: -8px;
  right: -7px;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #E53935;
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 13px;
  color: #0D1F3C;
  font-size: 17px;
  font-weight: 600;
}

.avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #EFF6FF;
  color: #0D1F3C;
}

.avatar svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 20px;
}

.metric-card,
.panel,
.gauge-card {
  border: 1px solid #E2E8F0;
  background: #ffffff;
  box-shadow: 0 7px 18px rgba(0,0,0,0.05);
}

.metric-card {
  min-height: 164px;
  padding: 23px 34px 22px;
  border-radius: 8px;
}

.metric-card h2 {
  margin: 0 0 12px;
  color: #0D1F3C;
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.1px;
}

.metric-value {
  display: flex;
  align-items: flex-end;
  gap: 13px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E2E8F0;
  color: #0D1F3C;
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
  color: #E53935;
}

.metric-caption .warning {
  color: #F57C00;
}

.metric-caption .success {
  color: #00897B;
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
  border-bottom: 1px solid #E2E8F0;
}

.panel-header h2 {
  margin: 0;
  color: #0D1F3C;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.panel-header a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #0D1F3C;
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
  font-size: 15px;
}

.panel-actions .square-button {
  width: 45px;
  padding: 0;
  justify-content: center;
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
  color: #4A5568;
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
  background:
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent calc(14.285% - 1px),
      #EDF2F7 calc(14.285% - 1px),
      #EDF2F7 14.285%
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
  border-bottom: 1px solid #E2E8F0;
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
  background: #1565C0;
}

.running {
  background: #00897B;
}

.change {
  background: #C0C4CC;
}

.delay {
  background: #E53935;
}

.empty {
  background:
    repeating-linear-gradient(
      -45deg,
      #EDF2F7 0,
      #EDF2F7 2px,
      #FAFBFD 2px,
      #FAFBFD 4px
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
  color: #0D1F3C;
}

.table-row {
  min-height: 57px;
  border-top: 1px solid #EDF2F7;
}

.table-row strong,
.table-row span,
.progress-cell b {
  color: #0D1F3C;
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
  background: #E8EAF0;
  overflow: hidden;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.progress-track .success {
  background: #00897B;
}

.progress-track .danger {
  background: #E53935;
}

.status {
  width: 78px;
  height: 36px;
  display: inline-grid;
  place-items: center;
  border-radius: 6px;
  background: #E6F4EA;
  color: #00897B;
  font-size: 15px;
}

.status.delayed {
  background: #FDECEA;
  color: #C62828;
}

.order-average {
  margin: 14px 31px 22px;
  padding: 13px 16px;
  border-top: 1px solid #E2E8F0;
  border-radius: 7px;
  background: #F8FAFC;
}

.order-average div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 9px;
  color: #4A5568;
  font-size: 14px;
  font-weight: 600;
}

.order-average strong {
  color: #0D1F3C;
  font-size: 18px;
  font-weight: 750;
}

.average-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #E8EAF0;
}

.average-track i {
  display: block;
  width: 58%;
  height: 100%;
  border-radius: inherit;
  background: #1565C0;
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
  background: #00897B;
}

.orange-dot {
  background: #F57C00;
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
  stroke: #E8EAF0;
}

.gauge-progress {
  stroke: #00897B;
}

.gauge.low .gauge-progress {
  stroke: #F57C00;
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
  color: #0D1F3C;
  font-size: 26px;
  line-height: 1.05;
  font-weight: 800;
}

.gauge-center span {
  display: block;
  margin-top: 8px;
  color: #0D1F3C;
  font-size: 15px;
  font-weight: 600;
}

.gauge-center b {
  display: block;
  margin-top: 8px;
  color: #00897B;
  font-size: 16px;
  font-weight: 700;
}

.gauge.low .gauge-center b {
  color: #F57C00;
}

.chatbot-button {
  position: fixed;
  right: 46px;
  bottom: 30px;
  width: 122px;
  height: 122px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 50%;
  background: #0D1F3C;
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
  box-shadow: 0 14px 30px rgba(4, 24, 62, 0.35);
}

.chat-bubble {
  width: 53px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: 22px;
  background: #ffffff;
}

.chat-bubble i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #0D1F3C;
}

button,
a {
  cursor: pointer;
}

.logout-item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  margin-top: auto;
  color: rgba(255, 255, 255, 0.6);
}

.logout-item:hover {
  background: rgba(229, 57, 53, 0.18);
  color: #ff7070;
}

@media (max-width: 1280px) {
  .dashboard-page {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .brand > span,
  .nav-item span:last-child {
    display: none;
  }

  .brand {
    justify-content: center;
    padding: 0;
  }

  .nav-item {
    justify-content: center;
    padding: 0;
  }

  .middle-grid,
  .metric-grid,
  .gauge-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .dashboard-page {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
  }

  .brand {
    height: 74px;
  }

  .brand > span,
  .nav-item span:last-child {
    display: inline;
  }

  .nav-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .nav-item {
    height: 58px;
    justify-content: flex-start;
    padding: 0 24px;
  }

  .main-content {
    padding: 24px 18px 34px;
  }

  .topbar,
  .top-actions {
    align-items: flex-start;
    flex-direction: column;
  }

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

  .chatbot-button {
    width: 88px;
    height: 88px;
    right: 18px;
    bottom: 18px;
    font-size: 14px;
  }
}
</style>
