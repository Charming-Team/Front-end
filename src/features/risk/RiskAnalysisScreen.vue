<template>
  <section class="risk-page">
    <div class="risk-actions">
      <button type="button" class="risk-action-button risk-action-button--ghost" @click="goToPreviousSimulations">
        이전 대응안 목록 조회
      </button>

      <button type="button" class="risk-action-button risk-action-button--primary" @click="goToPlanPage">생산 계획 수정하러 가기</button>
    </div>

    <div class="risk-summary-grid">
      <article class="risk-summary-card risk-summary-card--danger">
        <p class="risk-summary-title">납기 지연 예상</p>
        <strong>{{ riskSummary.expectedDelayDays }}일</strong>
        <span>{{ riskSummary.delayedOrderCount }}건</span>
      </article>

      <article class="risk-summary-card risk-summary-card--warning">
        <p class="risk-summary-title">자재 부족 예상</p>
        <strong>{{ riskSummary.materialShortageCount }}건</strong>
        <span>{{ formatNumber(riskSummary.materialShortageQuantity) }}개</span>
      </article>

      <article class="risk-summary-card risk-summary-card--critical">
        <p class="risk-summary-title">고위험 주문</p>
        <strong>{{ riskSummary.criticalOrderCount }}건</strong>
      </article>

      <article class="risk-summary-card risk-summary-card--primary">
        <p class="risk-summary-title">전체 리스크 수준</p>
        <strong>높음</strong>
      </article>
    </div>

    <section class="risk-list-card">
      <div class="risk-list-header">
        <h2>리스크 목록</h2>

        <div class="risk-list-controls">
          <select v-model="selectedLine" class="risk-select">
            <option value="">전체 라인</option>
            <option value="LINE-A">LINE-A</option>
            <option value="LINE-B">LINE-B</option>
            <option value="LINE-C">LINE-C</option>
          </select>

          <input v-model="keyword" class="risk-search" type="search" placeholder="주문번호, 고객사, 제품명 검색" />
        </div>
      </div>

      <div class="risk-filter-chips">
        <button type="button" class="risk-chip" @click="selectedRiskLevel = ''">전체 {{ riskItems.length }}</button>
        <button type="button" class="risk-chip risk-chip--critical" @click="selectedRiskLevel = 'CRITICAL'">매우 위험</button>
        <button type="button" class="risk-chip risk-chip--warning" @click="selectedRiskLevel = 'WARNING'">위험</button>
        <button type="button" class="risk-chip risk-chip--caution" @click="selectedRiskLevel = 'CAUTION'">주의</button>
        <button type="button" class="risk-chip risk-chip--safe" @click="selectedRiskLevel = 'SAFE'">안전</button>
      </div>

      <div class="risk-table-wrap">
        <table class="risk-table">
          <thead>
            <tr>
              <th>주문번호</th>
              <th>고객사</th>
              <th>제품명</th>
              <th>수량</th>
              <th>납기</th>
              <th>진행률</th>
              <th>생산 지연 위험</th>
              <th>상세</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in filteredRiskItems" :key="item.id">
              <td>{{ item.orderNo }}</td>
              <td>{{ item.customerName }}</td>
              <td>{{ item.productName }}</td>
              <td>{{ formatNumber(item.quantity) }}</td>
              <td>{{ item.dueDate }}</td>
              <td>
                <div class="risk-progress">
                  <span>{{ item.progressRate }}%</span>
                  <div class="risk-progress-bar">
                    <i :style="{ width: `${item.progressRate}%` }" />
                  </div>
                </div>
              </td>
              <td>
                <span :class="getRiskBadgeClass(item.riskLevel)">
                  {{ getRiskLevelLabel(item.riskLevel) }}
                </span>
              </td>
              <td>
                <button type="button" class="risk-detail-button" @click="handleClickDetail(item)">상세 보기</button>
              </td>
            </tr>

            <tr v-if="filteredRiskItems.length === 0">
              <td colspan="8" class="risk-empty">조회 조건에 맞는 리스크 항목이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { riskItems, riskSummary } from './mockData';
import { formatNumber, getRiskBadgeClass, getRiskLevelLabel } from './utils';
import './styles/risk-analysis-page.css';

const router = useRouter();

const keyword = ref('');
const selectedLine = ref('');
const selectedRiskLevel = ref('');

const filteredRiskItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return riskItems.filter((item) => {
    const matchesKeyword =
      !normalizedKeyword ||
      item.orderNo.toLowerCase().includes(normalizedKeyword) ||
      item.customerName.toLowerCase().includes(normalizedKeyword) ||
      item.productName.toLowerCase().includes(normalizedKeyword);

    const matchesLine = !selectedLine.value || item.lineName === selectedLine.value;
    const matchesRiskLevel = !selectedRiskLevel.value || item.riskLevel === selectedRiskLevel.value;

    return matchesKeyword && matchesLine && matchesRiskLevel;
  });
});

function goToPreviousSimulations() {
  router.push('/ai/result');
}

function goToPlanPage() {
  router.push('/plan');
}

function handleClickDetail(item) {
  router.push(`/risk/${item.orderNo}`);
}
</script>
