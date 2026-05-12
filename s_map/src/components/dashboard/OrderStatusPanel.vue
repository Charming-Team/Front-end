<template>
  <article class="card orders-panel dashboard-panel">
    <div class="card-body p-0">
      <div class="panel-header d-flex justify-content-between align-items-center gap-3">
        <h2 class="panel-title mb-0">{{ title }}</h2>
        <button class="more-link btn btn-link d-inline-flex align-items-center gap-1 p-0 border-0" type="button">
          더보기 <span class="arrow"></span>
        </button>
      </div>

      <div class="table-responsive order-table-wrap">
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
            <div class="d-flex align-items-center gap-3">
              <div class="progress flex-grow-1 progress-track" role="progressbar" :aria-valuenow="order.progress" aria-valuemin="0" aria-valuemax="100">
                <div
                  class="progress-bar"
                  :class="order.delayed ? 'bg-danger' : 'bg-success'"
                  :style="{ width: `${order.progress}%` }"
                ></div>
              </div>
              <b>{{ order.progress }}%</b>
            </div>
            <span class="badge status-badge" :class="order.delayed ? 'delayed' : 'normal'">
              {{ order.delayed ? "지연" : "진행 중" }}
            </span>
          </div>
        </div>
      </div>

      <div class="order-average p-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span>전체 평균 가동률</span>
          <strong>{{ averageRate }}%</strong>
        </div>
        <div class="progress average-track" role="progressbar" :aria-valuenow="averageRate" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-bar" :style="{ width: `${averageRate}%` }"></div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "주문 및 납기 현황",
  },
  orders: {
    type: Array,
    default: () => [],
  },
  averageRate: {
    type: Number,
    default: 0,
  },
});
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

.more-link {
  color: var(--color-text-main);
  font-size: 12px;
  font-weight: 600;
  background: transparent;
  box-shadow: none;
  line-height: 1;
  text-decoration: none;
}

.more-link:hover,
.more-link:focus {
  color: var(--color-text-main);
  background: transparent;
  box-shadow: none;
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

.order-table {
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: minmax(130px, 1.2fr) minmax(82px, 0.75fr) minmax(130px, 1fr) 62px;
  align-items: center;
  gap: 8px;
  padding: 0 26px;
}

.table-head {
  height: 28px;
  color: var(--color-navy);
}

.table-row {
  min-height: 32px;
  border-top: 1px solid var(--color-track-light);
}

.table-row strong,
.table-row span,
.progress-cell b {
  color: var(--color-navy);
}

.progress-track {
  height: 7px;
  border-radius: 999px;
  background: var(--color-track);
}

.status-badge {
  width: 54px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 20px;
}

.order-table-wrap {
  overflow-x: hidden;
}

.table-row strong,
.table-row > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge.normal {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.delayed {
  background: var(--color-danger-bg);
  color: var(--color-danger-dark);
}

.order-average {
  margin: 8px 26px 10px;
  border-top: 1px solid var(--color-border);
  border-radius: 7px;
  background: var(--color-bg-soft);
  color: var(--color-text-subtle);
  font-size: 11px;
  font-weight: 600;
}

.order-average strong {
  color: var(--color-navy);
  font-size: 13px;
  font-weight: 750;
}

.average-track {
  height: 6px;
  border-radius: 999px;
  background: var(--color-track);
}

.average-track .progress-bar {
  background: var(--color-primary);
}
</style>
