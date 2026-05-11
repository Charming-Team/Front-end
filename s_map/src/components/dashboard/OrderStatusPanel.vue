<template>
  <article class="panel orders-panel">
    <div class="panel-header compact">
      <h2>{{ title }}</h2>
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
        <strong>{{ averageRate }}%</strong>
      </div>
      <div class="average-track">
        <i :style="{ width: `${averageRate}%` }"></i>
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
  height: 100%;
  border-radius: inherit;
  background: var(--color-primary);
}
</style>
