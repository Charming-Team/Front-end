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
        <div class="risk-summary-header">
          <p class="risk-summary-title">납기 지연 예상</p>
          <span class="risk-summary-badge">{{ riskSummary.delayedOrderCount }}건</span>
        </div>

        <span class="risk-summary-value">{{ riskSummary.expectedDelayDays }}일</span>
      </article>

      <article class="risk-summary-card risk-summary-card--warning">
        <div class="risk-summary-header">
          <p class="risk-summary-title">자재 부족 예상</p>
          <span class="risk-summary-badge">{{ formatNumber(riskSummary.materialShortageQuantity) }}개</span>
        </div>

        <span class="risk-summary-value">{{ riskSummary.materialShortageCount }}건</span>
      </article>

      <article class="risk-summary-card risk-summary-card--critical">
        <div class="risk-summary-header">
          <p class="risk-summary-title">고위험 주문</p>
          <span class="risk-summary-badge">{{ riskSummary.criticalOrderCount }}건</span>
        </div>

        <span class="risk-summary-value">{{ riskSummary.criticalOrderCount }}건</span>
      </article>
    </div>

    <section class="risk-workspace" :class="{ 'risk-workspace--detail-open': selectedRiskItem }">
      <section class="risk-list-card">
        <template v-if="!selectedRiskItem">
          <div class="risk-list-header">
            <span class="risk-list-title">리스크 목록</span>

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

          <p v-if="isLoading" class="risk-empty">리스크 정보를 불러오는 중입니다.</p>
          <p v-else-if="errorMessage" class="risk-empty">{{ errorMessage }}</p>

          <template v-else>
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
                  <tr v-for="item in paginatedRiskItems" :key="item.orderId ?? item.id">
                    <td>{{ item.orderNo }}</td>
                    <td>{{ item.customerName }}</td>
                    <td>{{ item.productName }}</td>
                    <td>{{ formatNumber(item.quantity) }}</td>
                    <td>{{ item.dueDate }}</td>
                    <td>{{ item.lineName }}</td>
                    <td>
                      <div class="risk-progress">
                        <span>{{ formatPercent(item.progressRatePercent) }}%</span>
                        <div class="risk-progress-bar">
                          <span
                            class="risk-progress-fill"
                            :style="{ width: `${normalizePercent(item.progressRatePercent)}%` }"
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span :class="getRiskBadgeClass(item.riskLevel)">
                        {{ getRiskLevelLabel(item.riskLevel) }}
                      </span>
                    </td>
                    <td>
                      <button type="button" class="risk-detail-button" @click="handleClickDetail(item)">
                        상세 보기
                      </button>
                    </td>
                  </tr>

                  <tr v-if="paginatedRiskItems.length === 0">
                    <td colspan="9" class="risk-empty">조회 조건에 맞는 리스크 항목이 없습니다.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <nav
              v-if="totalPages > 1"
              class="risk-pagination"
              aria-label="리스크 목록 페이지네이션"
            >
              <button type="button" class="risk-page-button" @click="goFirstPage">«</button>
              <button type="button" class="risk-page-button" @click="goPrevPage">‹</button>

              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                class="risk-page-button risk-page-number"
                :class="{ active: page === currentPage }"
                @click="goPage(page)"
              >
                {{ page }}
              </button>

              <button type="button" class="risk-page-button" @click="goNextPage">›</button>
              <button type="button" class="risk-page-button" @click="goLastPage">»</button>
            </nav>
          </template>
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
                :key="item.orderId ?? item.id"
                type="button"
                class="risk-compact-row"
                :class="{ active: selectedRiskItem?.orderId === item.orderId }"
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
        <aside v-if="selectedRiskItem" class="risk-detail-panel">
          <div class="risk-detail-panel-header">
            <div>
              <h2>
                리스크 상세 분석
                <span :class="getRiskBadgeClass(detailRiskLevel)">
                  {{ selectedRiskDetail?.riskLevelLabel || getRiskLevelLabel(detailRiskLevel) }}
                </span>
              </h2>

              <p class="risk-predicted-at">
                예측 진행 시점: {{ selectedRiskDetail?.predictedAt || selectedRiskItem.predictedAt || '예측 정보 없음' }}
              </p>
            </div>

            <button type="button" class="risk-panel-close" @click="closeDetailPanel">×</button>
          </div>

          <div v-if="isDetailLoading" class="risk-detail-body">
            <p class="risk-empty">상세 정보를 불러오는 중입니다.</p>
          </div>

          <div v-else-if="selectedRiskDetail" class="risk-detail-body">
            <div class="risk-detail-progress-card">
              <div class="risk-detail-progress-header">
                <strong>생산 진행률</strong>
                <span>{{ formatPercent(selectedRiskDetail.progressRatePercent) }}%</span>
              </div>

              <div class="risk-detail-progress-bar">
                <span
                  class="risk-detail-progress-fill"
                  :style="{ width: `${normalizePercent(selectedRiskDetail.progressRatePercent)}%` }"
                />
              </div>

              <p>
                총 {{ formatNumber(selectedRiskDetail.quantity) }}개 중 {{ formatNumber(selectedRiskDetail.completedQuantity) }}개 완료,
                {{ formatNumber(selectedRiskDetail.remainingQuantity) }}개 잔여
              </p>
            </div>

            <div class="risk-detail-metric-grid">
              <article class="risk-detail-metric-card">
                <span>지연 확률</span>
                <strong>{{ formatDelayProbability(selectedRiskDetail) }}</strong>
              </article>

              <article class="risk-detail-metric-card">
                <span>예상 지연 일수</span>
                <strong>{{ formatExpectedDelayDays(selectedRiskDetail.expectedDelayDays) }}</strong>
              </article>
            </div>

            <template v-if="isSelectedRiskSafe">
              <p class="risk-detail-summary">
                {{ selectedRiskDetail.summary }}
              </p>
            </template>

            <template v-else>
              <div v-if="hasSelectedAgentAnalysis && selectedRiskDetail.causeTypes?.length" class="risk-cause-badge-group">
                <span v-for="causeType in selectedRiskDetail.causeTypes" :key="causeType" :class="getRiskCauseBadgeClass(causeType)">
                  {{ getRiskCauseLabel(causeType) }}
                </span>
              </div>

              <div v-else-if="!isSelectedRiskSafe" class="risk-cause-badge-group">
                <span class="risk-cause-badge"> 상세 분석 생성 후 제공 </span>
              </div>

              <p class="risk-detail-summary">
                {{ selectedRiskDetail.summary }}
              </p>

              <p class="risk-detail-message">
                {{ selectedRiskDetail.progressMessage }}
              </p>

              <div class="p-1">
                <span class="risk-recommendation-title mb-3 text-[18px] font-bold">권고 조치</span>

                <p class="risk-detail-summary">
                  {{ selectedRiskDetail.recommendation || '상세 분석 생성 후 제공 예정입니다.' }}
                </p>
              </div>

              <div v-if="normalizedDetailCauses.length > 0" class="risk-detail-causes">
                <strong>ML 지연 예측 원인</strong>
                <ul>
                  <li v-for="(cause, index) in normalizedDetailCauses" :key="getCauseKey(cause, index)">
                    <template v-if="typeof cause === 'string'">
                      {{ cause }}
                    </template>

                    <template v-else>
                      <strong>{{ cause.causeTypeLabel || cause.causeType || cause.title }}</strong>
                      <span v-if="cause.description"> - {{ cause.description }}</span>
                      <span v-else-if="cause.title"> - {{ cause.title }}</span>
                    </template>
                  </li>
                </ul>
              </div>

              <p v-else class="risk-detail-message">원인 상세: 상세 분석 생성 후 제공</p>
            </template>
          </div>

          <div v-else class="risk-detail-body">
            <p class="risk-empty">상세 정보를 불러오지 못했습니다.</p>
          </div>
        </aside>
      </Transition>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { fetchRiskOrderDetail, fetchRiskOrders, fetchRiskSummary } from './api.js';
import { formatNumber, getRiskBadgeClass, getRiskCauseBadgeClass, getRiskCauseLabel, getRiskLevelLabel } from './utils';
import './styles/risk-analysis-page.css';

const DEFAULT_RISK_SUMMARY = {
  expectedDelayDays: 0,
  delayedOrderCount: 0,
  materialShortageCount: 0,
  materialShortageQuantity: 0,
  criticalOrderCount: 0,
  overallRiskLevel: 'SAFE',
};

const router = useRouter();

const keyword = ref('');
const selectedLine = ref('');
const selectedRiskLevel = ref('');
const selectedRiskItem = ref(null);
const selectedRiskDetail = ref(null);

const riskSummary = ref({ ...DEFAULT_RISK_SUMMARY });
const riskItems = ref([]);

const isLoading = ref(false);
const isDetailLoading = ref(false);
const errorMessage = ref('');

const RISK_PAGE_SIZE = 7;

const currentPage = ref(1);

const lineOptions = computed(() => [...new Set(riskItems.value.map((item) => item.lineName).filter(Boolean))]);

const baseFilteredRiskItems = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return riskItems.value.filter((item) => {
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

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredRiskItems.value.length / RISK_PAGE_SIZE));
});

const paginatedRiskItems = computed(() => {
  const startIndex = (currentPage.value - 1) * RISK_PAGE_SIZE;
  return filteredRiskItems.value.slice(startIndex, startIndex + RISK_PAGE_SIZE);
});

const visiblePages = computed(() => {
  const maxVisibleCount = 5;
  const pages = [];

  let startPage = Math.max(1, currentPage.value - 2);
  let endPage = Math.min(totalPages.value, startPage + maxVisibleCount - 1);

  if (endPage - startPage + 1 < maxVisibleCount) {
    startPage = Math.max(1, endPage - maxVisibleCount + 1);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  return pages;
});

const detailRiskLevel = computed(() => selectedRiskDetail.value?.riskLevel || selectedRiskItem.value?.riskLevel || 'SAFE');

const isSelectedRiskSafe = computed(() => detailRiskLevel.value === 'SAFE');

const hasSelectedAgentAnalysis = computed(() => selectedRiskDetail.value?.hasAgentAnalysis === true);

const normalizedDetailCauses = computed(() => {
  const causes = selectedRiskDetail.value?.causes;

  if (!Array.isArray(causes)) {
    return [];
  }

  return causes.filter(Boolean);
});

watch([keyword, selectedLine, selectedRiskLevel], () => {
  currentPage.value = 1;
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

onMounted(() => {
  loadRiskPage();
});

async function loadRiskPage() {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    const [summary, orderList] = await Promise.all([
      fetchRiskSummary(),
      fetchRiskOrders({
        page: 0,
        size: 100,
      }),
    ]);

    riskSummary.value = {
      ...DEFAULT_RISK_SUMMARY,
      ...(summary ?? {}),
    };

    riskItems.value = Array.isArray(orderList?.items) ? orderList.items : [];
  } catch (error) {
    console.error(error);
    errorMessage.value = '리스크 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
    riskSummary.value = { ...DEFAULT_RISK_SUMMARY };
    riskItems.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function handleClickDetail(item) {
  selectedRiskItem.value = item;
  selectedRiskDetail.value = null;
  isDetailLoading.value = true;
  errorMessage.value = '';

  try {
    const orderId = item.orderId ?? item.id;
    selectedRiskDetail.value = await fetchRiskOrderDetail(orderId);
  } catch (error) {
    console.error(error);
    selectedRiskDetail.value = buildFallbackDetail(item);
  } finally {
    isDetailLoading.value = false;
  }
}

function buildFallbackDetail(item) {
  const riskLevel = item?.riskLevel ?? 'SAFE';

  if (riskLevel === 'SAFE') {
    return {
      ...item,
      riskLevel,
      riskLevelLabel: getRiskLevelLabel(riskLevel),
      delayProbability: item?.delayProbability ?? null,
      delayProbabilityPercent: item?.delayProbabilityPercent ?? null,
      predictedAt: item?.predictedAt ?? '예측 정보 없음',
      expectedDelayDays: null,
      title: `${item?.orderNo ?? '선택한'} 주문건은 현재 안전 단계입니다.`,
      causeTypes: [],
      summary: `${item?.orderNo ?? '선택한'} 주문건은 현재 안전 단계입니다. 현재 생산계획 기준 납기 내 완료 가능성이 높습니다.`,
      progressMessage: buildProgressMessage(item),
      recommendation: null,
      causes: [],
      hasAgentAnalysis: false,
    };
  }

  return {
    ...item,
    riskLevel,
    riskLevelLabel: getRiskLevelLabel(riskLevel),
    delayProbability: item?.delayProbability ?? null,
    delayProbabilityPercent: item?.delayProbabilityPercent ?? null,
    predictedAt: item?.predictedAt ?? '예측 정보 없음',
    expectedDelayDays: null,
    title: '리스크 상세 분석',
    causeTypes: [],
    summary: `${item?.orderNo ?? '선택한'} 주문건의 상세 분석 데이터가 아직 생성되지 않았습니다.`,
    progressMessage: buildProgressMessage(item),
    recommendation: null,
    causes: [],
    hasAgentAnalysis: false,
  };
}

function buildProgressMessage(item) {
  return `생산 진행률은 ${formatPercent(item?.progressRatePercent)}%이며, 총 ${formatNumber(item?.quantity ?? 0)}개 중 ${formatNumber(
    item?.completedQuantity ?? 0
  )}개 완료, ${formatNumber(item?.remainingQuantity ?? 0)}개 잔여 상태입니다.`;
}

function closeDetailPanel() {
  selectedRiskItem.value = null;
  selectedRiskDetail.value = null;
  isDetailLoading.value = false;
}

function goToPreviousSimulations() {
  router.push('/ai/result');
}

function goToPlanPage() {
  router.push('/plan');
}

function normalizePercent(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(Math.max(numericValue, 0), 100);
}

function formatPercent(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '0';
  }

  return Number(numericValue.toFixed(1)).toString();
}

function formatExpectedDelayDays(value) {
  if (value === null || value === undefined || value === '') {
    return '예측 전';
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '예측 전';
  }

  return `${Number(numericValue.toFixed(1))}일`;
}

function formatDelayProbability(value) {
  const percentValue = value?.delayProbabilityPercent;

  if (percentValue !== null && percentValue !== undefined && Number.isFinite(Number(percentValue))) {
    return `${Number(Number(percentValue).toFixed(2))}%`;
  }

  const probabilityValue = value?.delayProbability;

  if (probabilityValue !== null && probabilityValue !== undefined && Number.isFinite(Number(probabilityValue))) {
    return `${Number((Number(probabilityValue) * 100).toFixed(2))}%`;
  }

  return '예측 전';
}

function goFirstPage() {
  currentPage.value = 1;
}

function goPrevPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goPage(page) {
  currentPage.value = Math.min(Math.max(Number(page), 1), totalPages.value);
}

function goNextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

function goLastPage() {
  currentPage.value = totalPages.value;
}

function getCauseKey(cause, index) {
  if (typeof cause === 'string') {
    return `${cause}-${index}`;
  }

  return `${cause?.causeType ?? 'cause'}-${cause?.title ?? ''}-${index}`;
}
</script>
