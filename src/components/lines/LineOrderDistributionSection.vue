<script setup>
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";
import { formatKg } from "../../features/lines/utils.js";

defineProps({
  order: { type: Object, required: true },
  statusMeta: { type: Object, required: true },
});
</script>

<template>
  <AppCard class="distribution-shell">
    <div class="distribution-shell__body">
      <div class="order-summary-grid">
        <AppCard class="summary-card summary-card--primary">
        <p class="summary-label">주문별 생산 라인 분배</p>
        <strong class="summary-order-id">{{ order.id }}</strong>
        <dl class="summary-meta">
          <div>
            <dt>제품명</dt>
            <dd>{{ order.product }}</dd>
          </div>
          <div>
            <dt>주문 수량</dt>
            <dd>{{ formatKg(order.orderAmountKg) }}</dd>
          </div>
        </dl>
        </AppCard>

        <AppCard class="summary-card metric-card">
          <p class="metric-card__label">총 생산 라인 수</p>
          <strong class="metric-card__value">{{ order.lineCount }} 개</strong>
        </AppCard>

        <AppCard class="summary-card metric-card">
          <p class="metric-card__label">총 생산 수량</p>
          <strong class="metric-card__value">{{ formatKg(order.totalProducedKg) }}</strong>
        </AppCard>

        <AppCard class="summary-card metric-card">
          <p class="metric-card__label">생산 진행률</p>
          <strong class="metric-card__value">{{ order.progressRate }} %</strong>
          <div class="metric-card__progress">
            <span :style="{ width: `${order.progressRate}%` }"></span>
          </div>
        </AppCard>

        <AppCard class="summary-card metric-card">
          <p class="metric-card__label">납기까지 남은 기간</p>
          <strong class="metric-card__value">{{ order.daysUntilDeadlineLabel }}</strong>
        </AppCard>
      </div>

      <div class="table-section">
        <AppSectionHeader class="section-header-shell" title="주문 라인 분배 현황" />

        <AppCard class="table-card">
          <div class="table-wrap">
            <table class="order-line-table">
              <thead>
                <tr>
                  <th>라인명</th>
                  <th>제품명</th>
                  <th>계획 생산량</th>
                  <th>생산 수량</th>
                  <th>진행률</th>
                  <th>상태</th>
                  <th>전환 예상 시점</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="order.lineDetails.length === 0">
                  <td colspan="7" class="table-state">조회된 라인 분배 현황이 없습니다.</td>
                </tr>
                <tr v-for="item in order.lineDetails" :key="`${item.lineName}-${item.productName}`">
                  <td>{{ item.lineName }}</td>
                  <td>{{ item.productName }}</td>
                  <td>{{ item.plannedKg.toLocaleString("ko-KR") }} kg</td>
                  <td>{{ item.producedKg.toLocaleString("ko-KR") }} kg</td>
                  <td>
                    <div class="progress-cell">
                      <span>{{ item.progressRate }}%</span>
                      <div class="progress-bar">
                        <span :style="{ width: `${item.progressRate}%` }"></span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <AppStatusBadge
                      :label="statusMeta[item.status]?.label ?? item.statusLabel ?? item.status"
                      :tone="statusMeta[item.status]?.tone ?? 'pending'"
                    />
                  </td>
                  <td>{{ item.changeEta }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.distribution-shell {
  padding: 12px;
}

.distribution-shell__body {
  display: grid;
  gap: 12px;
}

.order-summary-grid {
  display: grid;
  grid-template-columns: 1.35fr repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  min-width: 0;
  padding: 18px 20px;
}

.summary-card--primary {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.summary-label,
.metric-card__label {
  margin: 0 0 10px;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
}

.summary-order-id {
  display: block;
  margin-bottom: 12px;
  color: #0f172a;
  font-size: 28px;
  line-height: 1;
  font-weight: 900;
}

.summary-meta {
  display: grid;
  gap: 8px;
  margin: 0;
}

.summary-meta div {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-meta dt {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.summary-meta dd {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

.metric-card__value {
  display: block;
  color: #1e3a8a;
  font-size: 30px;
  line-height: 1.05;
  font-weight: 900;
}

.metric-card__progress {
  height: 6px;
  margin-top: 14px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.metric-card__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

.table-section {
  padding: 0;
}

.table-card {
  padding: 0;
}

.section-header-shell {
  padding: 0 6px 4px;
}

.table-wrap {
  overflow-x: auto;
}

.order-line-table {
  width: 100%;
  min-width: 880px;
  border-collapse: collapse;
  background: #ffffff;
}

.order-line-table thead th {
  padding: 12px 16px;
  background: #f8fafc;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.order-line-table tbody td {
  padding: 12px 16px;
  border-top: 1px solid #eef2f7;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.table-state {
  height: 96px;
  color: #667085 !important;
  text-align: center;
}

.progress-cell {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.progress-cell span {
  color: #475467;
  font-size: 13px;
  font-weight: 700;
}

.progress-bar {
  width: 90px;
  height: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

@media (max-width: 1180px) {
  .order-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card--primary {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .distribution-shell {
    padding: 8px;
  }

  .order-summary-grid {
    grid-template-columns: 1fr;
  }

  .section-header-shell {
    padding: 0 4px 4px;
  }
}
</style>
