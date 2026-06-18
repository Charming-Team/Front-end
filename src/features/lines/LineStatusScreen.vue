<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import LineCompositionChart from "../../components/lines/LineCompositionChart.vue";
import LineOperatingTable from "../../components/lines/LineOperatingTable.vue";
import LineOrderDistributionSection from "../../components/lines/LineOrderDistributionSection.vue";
import LineSearchBar from "../../components/lines/LineSearchBar.vue";
import {
  fetchLineMachineOperationStatuses,
  fetchLineOperationStatuses,
  fetchOrderDistribution,
  searchLineOrders,
} from "./api.js";
import {
  lineStatusMeta,
  lineStatusOptions,
  pageSizeOptions,
} from "./mockData.js";
import {
  buildLineOptions,
  getVisiblePages,
  normalizeLineMachineStatus,
  normalizeLineOperationStatus,
  normalizeOrderDistribution,
  normalizeOrderSearchResult,
} from "./utils.js";

const pageSize = ref("5");
const route = useRoute();
const currentPage = ref(1);
const pageCount = ref(1);
const totalCount = ref(0);

const draftLine = ref("all");
const draftStatus = ref("all");

const selectedLine = ref("all");
const selectedStatus = ref("all");

const draftOrderKeyword = ref("");
const orderKeyword = ref("");

const lines = ref([]);
const allLines = ref([]);
const machineLines = ref([]);
const orderDistributions = ref([]);

const lineLoading = ref(false);
const lineError = ref("");
const machineLoading = ref(false);
const machineError = ref("");
const orderLoading = ref(false);
const orderError = ref("");

const lineOptions = computed(() => buildLineOptions(allLines.value.length ? allLines.value : lines.value));
const visiblePages = computed(() =>
  getVisiblePages(currentPage.value, pageCount.value)
);

function syncRouteLineFilter() {
  const routeLineId = route.query.lineId;
  const nextLineId = Array.isArray(routeLineId) ? routeLineId[0] : routeLineId;
  const normalizedLineId = nextLineId ? String(nextLineId) : "all";

  draftLine.value = normalizedLineId;
  selectedLine.value = normalizedLineId;
}

const chartItems = computed(() => {
  const visibleLineIds = new Set(
    allLines.value
      .filter((line) => {
        const matchesLine = selectedLine.value === "all" || String(line.lineId) === selectedLine.value;
        const matchesStatus = selectedStatus.value === "all" || line.status === selectedStatus.value;
        return matchesLine && matchesStatus;
      })
      .map((line) => String(line.lineId))
  );

  return machineLines.value.filter((line) => visibleLineIds.has(String(line.lineId)));
});

/**
 * 목적: 라인 선택 옵션과 설비 구성도 데이터를 함께 조회한다.
 * 입력: 없음. 내부에서 전체 라인과 전체 설비 상태 API를 호출한다.
 * 출력: 반환값 없음. allLines, machineLines, machineLoading/machineError를 갱신한다.
 * 처리 흐름:
 * 1. 라인 운영 현황과 라인별 설비 상태를 병렬 조회한다.
 * 2. 라인 응답은 normalizeLineOperationStatus로 옵션/필터 기준 모델에 맞춘다.
 * 3. 설비 응답은 normalizeLineMachineStatus로 차트 모델에 맞춘다.
 * 4. 실패하면 관련 목록을 비우고 설비 영역 오류 메시지를 저장한다.
 */
async function loadLineOptionsAndMachines() {
  machineLoading.value = true;
  machineError.value = "";

  try {
    const [lineResponse, machineResponse] = await Promise.all([
      fetchLineOperationStatuses({ page: 0, size: 100 }),
      fetchLineMachineOperationStatuses(),
    ]);
    const lineContent = Array.isArray(lineResponse?.content) ? lineResponse.content : [];

    allLines.value = lineContent.map(normalizeLineOperationStatus);
    machineLines.value = Array.isArray(machineResponse)
      ? machineResponse.map(normalizeLineMachineStatus)
      : [];
  } catch (err) {
    allLines.value = [];
    machineLines.value = [];
    machineError.value = err.message || "라인별 설비 가동 현황을 불러오지 못했습니다.";
  } finally {
    machineLoading.value = false;
  }
}

/**
 * 목적: 현재 라인/상태/페이지 조건에 맞는 라인 가동 현황 목록을 조회한다.
 * 입력: selectedLine, selectedStatus, currentPage, pageSize.
 * 출력: 반환값 없음. lines, totalCount, pageCount, lineLoading/lineError를 갱신한다.
 * 처리 흐름:
 * 1. fetchLineOperationStatuses에 페이지와 필터 조건을 전달한다.
 * 2. 응답 content를 normalizeLineOperationStatus로 화면 행 모델에 맞춘다.
 * 3. totalElements/totalPages 기준으로 페이지 상태를 갱신한다.
 * 4. 실패하면 목록과 페이지 상태를 초기화하고 오류 메시지를 표시한다.
 */
async function loadLines() {
  lineLoading.value = true;
  lineError.value = "";

  try {
    const response = await fetchLineOperationStatuses({
      page: Math.max(0, currentPage.value - 1),
      size: Number(pageSize.value),
      lineId: selectedLine.value,
      status: selectedStatus.value,
    });
    const content = Array.isArray(response?.content) ? response.content : [];

    lines.value = content.map(normalizeLineOperationStatus);
    totalCount.value = Number(response?.totalElements ?? content.length);
    pageCount.value = Math.max(
      1,
      Number(response?.totalPages ?? Math.ceil(totalCount.value / Number(pageSize.value)))
    );
  } catch (err) {
    lines.value = [];
    totalCount.value = 0;
    pageCount.value = 1;
    lineError.value = err.message || "라인별 가동 현황을 불러오지 못했습니다.";
  } finally {
    lineLoading.value = false;
  }
}

/**
 * 목적: 주문 검색어 기준으로 라인별 주문 배분/진척 현황을 조회한다.
 * 입력: orderKeyword 상태.
 * 출력: 반환값 없음. orderDistributions, orderLoading/orderError를 갱신한다.
 * 처리 흐름:
 * 1. searchLineOrders로 주문 후보를 조회한다.
 * 2. 각 주문별 상세 배분은 fetchOrderDistribution으로 추가 조회한다.
 * 3. 상세 조회가 실패한 주문은 검색 결과만으로 normalizeOrderSearchResult를 만든다.
 * 4. 전체 검색 실패 시 배분 목록을 비우고 오류 메시지를 저장한다.
 */
async function loadOrderDistributions() {
  orderLoading.value = true;
  orderError.value = "";

  try {
    const response = await searchLineOrders({
      page: 0,
      size: 5,
      keyword: orderKeyword.value,
    });
    const content = Array.isArray(response?.content) ? response.content : [];

    orderDistributions.value = await Promise.all(
      content.map(async (order) => {
        try {
          return normalizeOrderDistribution(await fetchOrderDistribution(order.orderId));
        } catch {
          return normalizeOrderSearchResult(order);
        }
      })
    );
  } catch (err) {
    orderDistributions.value = [];
    orderError.value = err.message || "라인 현황 주문 검색 결과를 불러오지 못했습니다.";
  } finally {
    orderLoading.value = false;
  }
}

/**
 * 목적: 라인 운영 테이블의 draft 필터를 실제 조회 조건으로 적용한다.
 * 입력: draftLine, draftStatus.
 * 출력: 반환값 없음. selectedLine/selectedStatus/currentPage를 갱신하고 loadLines를 호출한다.
 * 처리 흐름:
 * 1. draft 값을 selected 값으로 복사한다.
 * 2. 첫 페이지로 이동한다.
 * 3. 변경된 조건으로 라인 목록을 다시 조회한다.
 */
function applyLineFilters() {
  selectedLine.value = draftLine.value;
  selectedStatus.value = draftStatus.value;
  currentPage.value = 1;
  loadLines();
}

function applyOrderSearch() {
  orderKeyword.value = draftOrderKeyword.value;
  loadOrderDistributions();
}

function goToFirstPage() {
  if (currentPage.value === 1) return;
  currentPage.value = 1;
  loadLines();
}

function goToPage(page) {
  if (page < 1 || page > pageCount.value || page === currentPage.value) return;
  currentPage.value = page;
  loadLines();
}

function goToPrevPage() {
  if (currentPage.value === 1) return;
  currentPage.value = Math.max(1, currentPage.value - 1);
  loadLines();
}

function goToNextPage() {
  if (currentPage.value === pageCount.value) return;
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
  loadLines();
}

watch(pageSize, () => {
  currentPage.value = 1;
  loadLines();
});

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) {
    currentPage.value = nextPageCount;
    loadLines();
  }
});

watch(
  () => route.query.lineId,
  () => {
    syncRouteLineFilter();
    currentPage.value = 1;
    loadLines();
  }
);

onMounted(() => {
  syncRouteLineFilter();
  loadLineOptionsAndMachines();
  loadLines();
  loadOrderDistributions();
});
</script>

<template>
  <div class="line-status-page">
    <div class="line-status-page-top">
      <LineOperatingTable
        :lines="lines"
        :line-options="lineOptions"
        :status-options="lineStatusOptions"
        :status-meta="lineStatusMeta"
        :selected-line="draftLine"
        :selected-status="draftStatus"
        :total-count="totalCount"
        :page-size="pageSize"
        :page-size-options="pageSizeOptions"
        :current-page="currentPage"
        :page-count="pageCount"
        :visible-pages="visiblePages"
        :loading="lineLoading"
        :error="lineError"
        @update:selected-line="draftLine = $event"
        @update:selected-status="draftStatus = $event"
        @update:page-size="pageSize = $event"
        @search="applyLineFilters"
        @retry="loadLines"
        @go-first-page="goToFirstPage"
        @go-prev-page="goToPrevPage"
        @go-page="goToPage"
        @go-next-page="goToNextPage"
      />

      <LineCompositionChart
        :items="chartItems"
        :loading="machineLoading"
        :error="machineError"
      />
    </div>

    <LineSearchBar
      :keyword="draftOrderKeyword"
      @update:keyword="draftOrderKeyword = $event"
      @search="applyOrderSearch"
    />

    <div v-if="orderLoading" class="line-status-page-state">주문별 생산 라인 분배 현황을 불러오는 중입니다.</div>
    <div v-else-if="orderError" class="line-status-page-state line-status-page-state-error">
      {{ orderError }}
    </div>
    <div v-else-if="orderDistributions.length === 0" class="line-status-page-state">
      조회된 주문별 생산 라인 분배 현황이 없습니다.
    </div>

    <LineOrderDistributionSection
      v-for="order in orderDistributions"
      :key="order.id"
      :order="order"
      :status-meta="lineStatusMeta"
    />
  </div>
</template>

<style scoped>
.line-status-page {
  display: grid;
  gap: 12px;
}

.line-status-page-top {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 1fr);
  gap: 12px;
}

.line-status-page-state {
  display: grid;
  min-height: 120px;
  place-items: center;
  border: 1px solid #e7edf5;
  border-radius: 8px;
  background: #ffffff;
  color: #667085;
  font-size: 14px;
  font-weight: 800;
}

.line-status-page-state-error {
  color: #d92d20;
}

@media (max-width: 1180px) {
  .line-status-page-top {
    grid-template-columns: 1fr;
  }
}
</style>
