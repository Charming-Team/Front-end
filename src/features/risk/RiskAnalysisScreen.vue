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
    </div>

    <section class="risk-workspace" :class="{ 'risk-workspace--detail-open': selectedRiskItem }">
      <section class="risk-list-card">
        <template v-if="!selectedRiskItem">
          <div class="risk-list-header">
            <h2>리스크 목록</h2>

            <div class="risk-list-controls">
              <select v-model="selectedLine" class="risk-select">
                <option value="">전체 라인</option>
                <option v-for="line in lineOptions" :key="line" :value="line">
                  {{ line }}
                </option>
              </select>

              <input v-model="keyword" class="risk-search" type="search" placeholder="주문번호, 고객사, 제품명 검색" />
            </div>
          </div>

          <div class="risk-filter-chips">
            <button
              type="button"
              class="risk-chip risk-chip--all"
              :class="{ active: selectedRiskLevel === '' }"
              @click="selectedRiskLevel = ''"
            >
              전체 {{ riskCounts.ALL }}
            </button>

            <button
              type="button"
              class="risk-chip risk-chip--critical"
              :class="{ active: selectedRiskLevel === 'CRITICAL' }"
              @click="selectedRiskLevel = 'CRITICAL'"
            >
              매우 위험 {{ riskCounts.CRITICAL }}
            </button>

            <button
              type="button"
              class="risk-chip risk-chip--warning"
              :class="{ active: selectedRiskLevel === 'WARNING' }"
              @click="selectedRiskLevel = 'WARNING'"
            >
              위험 {{ riskCounts.WARNING }}
            </button>

            <button
              type="button"
              class="risk-chip risk-chip--caution"
              :class="{ active: selectedRiskLevel === 'CAUTION' }"
              @click="selectedRiskLevel = 'CAUTION'"
            >
              주의 {{ riskCounts.CAUTION }}
            </button>

            <button
              type="button"
              class="risk-chip risk-chip--safe"
              :class="{ active: selectedRiskLevel === 'SAFE' }"
              @click="selectedRiskLevel = 'SAFE'"
            >
              안전 {{ riskCounts.SAFE }}
            </button>
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
                  <th>생산 라인</th>
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
                  <td>{{ item.lineName }}</td>
                  <td>
                    <div class="risk-progress">
                      <span>{{ item.progressRate }}%</span>
                      <div class="risk-progress-bar">
                        <span class="risk-progress-fill" :style="{ width: `${item.progressRate}%` }" />
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
                  <td colspan="9" class="risk-empty">조회 조건에 맞는 리스크 항목이 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <template v-else>
          <div class="risk-compact-list">
            <h2>리스크 목록</h2>

            <div class="risk-compact-table">
              <div class="risk-compact-head">
                <span>주문번호</span>
                <span>생산 지연 위험</span>
              </div>

              <button
                v-for="item in riskItems"
                :key="item.id"
                type="button"
                class="risk-compact-row"
                :class="{ active: selectedRiskItem?.orderNo === item.orderNo }"
                @click="handleClickDetail(item)"
              >
                <span>{{ item.orderNo }}</span>
                <span :class="getRiskBadgeClass(item.riskLevel)">
                  {{ getRiskLevelLabel(item.riskLevel) }}
                </span>
              </button>
            </div>
          </div>
        </template>
      </section>
      <Transition name="risk-detail-slide">
        <aside v-if="selectedRiskItem && selectedRiskDetail" class="risk-detail-panel">
          <div class="risk-detail-panel-header">
            <div>
              <h2>
                리스크 상세 분석
                <span :class="getRiskBadgeClass(selectedRiskDetail.riskLevel)">
                  {{ selectedRiskDetail.riskLevelLabel || getRiskLevelLabel(selectedRiskDetail.riskLevel) }}
                </span>
              </h2>

              <p class="risk-predicted-at">예측 진행 시점: {{ selectedRiskDetail.predictedAt }}</p>
            </div>

            <button type="button" class="risk-panel-close" @click="closeDetailPanel">×</button>
          </div>

          <div class="risk-detail-body">
            <div class="risk-detail-progress-card">
              <div class="risk-detail-progress-header">
                <strong>생산 진행률</strong>
                <span>{{ selectedRiskItem.progressRate }}%</span>
              </div>

              <div class="risk-detail-progress-bar">
                <span class="risk-detail-progress-fill" :style="{ width: `${selectedRiskItem.progressRate}%` }" />
              </div>

              <p>
                총 {{ formatNumber(selectedRiskItem.quantity) }}개 중 {{ formatNumber(selectedRiskItem.completedQuantity) }}개 완료,
                {{ formatNumber(selectedRiskItem.remainingQuantity) }}개 잔여
              </p>
            </div>

            <div class="risk-cause-badge-group">
              <span v-for="causeType in selectedRiskDetail.causeTypes" :key="causeType" :class="getRiskCauseBadgeClass(causeType)">
                {{ getRiskCauseLabel(causeType) }}
              </span>

              <span v-if="!selectedRiskDetail.causeTypes || selectedRiskDetail.causeTypes.length === 0" class="risk-cause-badge">
                주요 원인 없음
              </span>
            </div>

            <p class="risk-detail-summary">
              {{ selectedRiskDetail.summary }}
            </p>

            <p class="risk-detail-message">
              {{ selectedRiskDetail.progressMessage }}
            </p>

            <p class="risk-detail-message">
              {{ selectedRiskDetail.recommendation }}
            </p>

            <div class="risk-detail-causes">
              <strong>주요 원인</strong>
              <ul>
                <li v-for="cause in selectedRiskDetail.causes" :key="cause">
                  {{ cause }}
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </Transition>
    </section>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { riskDetailMap, riskItems, riskSummary } from './mockData';
import { formatNumber, getRiskBadgeClass, getRiskCauseBadgeClass, getRiskCauseLabel, getRiskLevelLabel } from './utils';
import './styles/risk-analysis-page.css';

const router = useRouter();

const keyword = ref('');
const selectedLine = ref('');
const selectedRiskLevel = ref('');
const selectedRiskItem = ref(null);

const lineOptions = [...new Set(riskItems.map((item) => item.lineName).filter(Boolean))];

const baseFilteredRiskItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return riskItems.filter((item) => {
    const orderNo = String(item.orderNo ?? '').toLowerCase();
    const customerName = String(item.customerName ?? '').toLowerCase();
    const productName = String(item.productName ?? '').toLowerCase();

    const matchesKeyword =
      !normalizedKeyword ||
      orderNo.includes(normalizedKeyword) ||
      customerName.includes(normalizedKeyword) ||
      productName.includes(normalizedKeyword);

    const matchesLine = !selectedLine.value || item.lineName === selectedLine.value;

    return matchesKeyword && matchesLine;
  });
});

const riskCounts = computed(() => ({
  ALL: baseFilteredRiskItems.value.length,
  CRITICAL: baseFilteredRiskItems.value.filter((item) => item.riskLevel === 'CRITICAL').length,
  WARNING: baseFilteredRiskItems.value.filter((item) => item.riskLevel === 'WARNING').length,
  CAUTION: baseFilteredRiskItems.value.filter((item) => item.riskLevel === 'CAUTION').length,
  SAFE: baseFilteredRiskItems.value.filter((item) => item.riskLevel === 'SAFE').length,
}));

const filteredRiskItems = computed(() => {
  if (!selectedRiskLevel.value) return baseFilteredRiskItems.value;

  return baseFilteredRiskItems.value.filter((item) => item.riskLevel === selectedRiskLevel.value);
});

const selectedRiskDetail = computed(() => {
  if (!selectedRiskItem.value) return null;

  return (
    riskDetailMap[selectedRiskItem.value.orderNo] ?? {
      riskLevel: selectedRiskItem.value.riskLevel,
      riskLevelLabel: getRiskLevelLabel(selectedRiskItem.value.riskLevel),
      delayProbability: 0,
      predictedAt: '예측 정보 없음',
      title: '리스크 상세 분석',
      causeTypes: [],
      summary: `${selectedRiskItem.value.orderNo} 주문건의 상세 분석 데이터가 아직 생성되지 않았습니다.`,
      progressMessage: '현재 표시 가능한 상세 생산 진행 정보가 없습니다.',
      recommendation: '상세 분석 생성 후 대응 권고를 확인할 수 있습니다.',
      causes: ['상세 원인 분석 데이터가 없습니다.'],
    }
  );
});

function goToPreviousSimulations() {
  router.push('/ai/result');
}

function goToPlanPage() {
  router.push('/plan');
}

function handleClickDetail(item) {
  selectedRiskItem.value = item;
}

function closeDetailPanel() {
  selectedRiskItem.value = null;
}
</script>
