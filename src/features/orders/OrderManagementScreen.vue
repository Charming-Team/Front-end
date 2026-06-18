<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import OrderAddModal from "../../components/orders/OrderAddModal.vue";
import OrderDetailModal from "../../components/orders/OrderDetailModal.vue";
import OrderPostSaveModal from "../../components/orders/OrderPostSaveModal.vue";
import OrderSearchCard from "../../components/orders/OrderSearchCard.vue";
import OrderTableSection from "../../components/orders/OrderTableSection.vue";
import { getUserRole } from "../../utils/storage.js";
import {
  createOrder,
  fetchNextOrderNo,
  fetchOrder,
  fetchOrders,
} from "./api.js";
import {
  pageSizeOptions,
  statusMeta,
  statusOptions,
} from "./mockData.js";
import { getProductionStartDateMinDate } from "./productionAvailability.js";
import {
  buildOrderCreatePayload,
  buildSelectOptions,
  createDefaultOrderForm,
  getVisiblePages,
  normalizeOrderDetail,
  normalizeOrderSummary,
  validateOrderForm,
} from "./utils.js";

const route = useRoute();
const router = useRouter();
const orders = ref([]);
const pageSize = ref("10");
const currentPage = ref(1);
const pageCount = ref(1);
const totalCount = ref(0);
const loading = ref(false);
const error = ref("");

const draftKeyword = ref("");
const draftStatus = ref("all");
const draftCustomer = ref("all");
const draftProduct = ref("all");
const draftStartDate = ref("");
const draftEndDate = ref("");

const searchQuery = ref("");
const selectedStatus = ref("all");
const selectedCustomer = ref("all");
const selectedProduct = ref("all");
const selectedStartDate = ref("");
const selectedEndDate = ref("");

const isAddModalOpen = ref(false);
const isPostSaveModalOpen = ref(false);
const addForm = ref(createDefaultOrderForm());
const nextOrderNo = ref("");
const addLoading = ref(false);
const addError = ref("");
const lastCreatedOrder = ref(null);
const selectedOrder = ref(null);
const detailLoading = ref(false);
const detailError = ref("");

function keepSelectedOption(options, value) {
  if (!value || value === "all" || options.some((option) => option.value === value)) {
    return options;
  }

  return [...options, { value, label: value }];
}

function isInvalidDateRange(startDate, endDate) {
  return Boolean(startDate && endDate && startDate > endDate);
}

const customerOptions = computed(() =>
  keepSelectedOption(buildSelectOptions(orders.value, "customer", "고객사 전체"), draftCustomer.value)
);
const productOptions = computed(() => {
  const productMap = new Map();

  orders.value.forEach((order) => {
    if (!order.productId) return;
    const labelParts = [order.product, order.productCode].filter(Boolean);
    productMap.set(String(order.productId), labelParts.length ? labelParts.join(" / ") : `제품 ${order.productId}`);
  });

  return keepSelectedOption([
    { value: "all", label: "제품 전체" },
    ...Array.from(productMap.entries()).map(([value, label]) => ({ value, label })),
  ], draftProduct.value);
});
const productionStartDateMin = computed(() => getProductionStartDateMinDate());
const canCreateOrder = computed(() => getUserRole() === "MANUFACTURING_MANAGER");
const visiblePages = computed(() => getVisiblePages(currentPage.value, pageCount.value));
const paginatedOrders = computed(() => orders.value);

/**
 * 목적: 현재 선택된 필터/페이지 조건으로 주문 목록을 조회한다.
 * 입력: selected* 필터 상태, currentPage, pageSize.
 * 출력: 반환값 없음. orders, totalCount, pageCount, loading/error 상태를 갱신한다.
 * 처리 흐름:
 * 1. 납기일 범위를 먼저 검증하고 잘못된 경우 목록과 페이지 상태를 초기화한다.
 * 2. fetchOrders에 페이지/검색/상태/고객/제품/납기 조건을 전달한다.
 * 3. 응답 content를 normalizeOrderSummary로 화면 모델에 맞춘다.
 * 4. 실패하면 목록을 비우고 사용자 메시지를 error에 저장한다.
 */
async function loadOrders() {
  if (isInvalidDateRange(selectedStartDate.value, selectedEndDate.value)) {
    orders.value = [];
    totalCount.value = 0;
    pageCount.value = 1;
    error.value = "납기일 시작일은 종료일보다 늦을 수 없습니다.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const response = await fetchOrders({
      page: Math.max(0, currentPage.value - 1),
      size: Number(pageSize.value),
      keyword: searchQuery.value,
      status: selectedStatus.value,
      customerName: selectedCustomer.value,
      productId: selectedProduct.value,
      dueDateFrom: selectedStartDate.value,
      dueDateTo: selectedEndDate.value,
    });
    const content = Array.isArray(response?.content) ? response.content : [];

    orders.value = content.map(normalizeOrderSummary);
    totalCount.value = Number(response?.totalElements ?? content.length);
    pageCount.value = Math.max(
      1,
      Number(response?.totalPages ?? Math.ceil(totalCount.value / Number(pageSize.value)))
    );
  } catch (err) {
    orders.value = [];
    totalCount.value = 0;
    pageCount.value = 1;
    error.value = err.message || "주문 목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

/**
 * 목적: 검색 카드의 draft 필터를 실제 조회 필터로 확정하고 목록을 다시 조회한다.
 * 입력: draftKeyword/draftStatus/draftCustomer/draftProduct/draftStartDate/draftEndDate.
 * 출력: 반환값 없음. selected* 필터와 currentPage를 갱신한 뒤 loadOrders를 호출한다.
 * 처리 흐름:
 * 1. draft 날짜 범위를 검증해 잘못된 경우 조회를 중단한다.
 * 2. draft 상태를 selected 상태로 복사한다.
 * 3. 첫 페이지로 이동한 뒤 주문 목록을 다시 불러온다.
 */
function applyFilters() {
  if (isInvalidDateRange(draftStartDate.value, draftEndDate.value)) {
    orders.value = [];
    totalCount.value = 0;
    pageCount.value = 1;
    error.value = "납기일 시작일은 종료일보다 늦을 수 없습니다.";
    currentPage.value = 1;
    return;
  }

  searchQuery.value = draftKeyword.value;
  selectedStatus.value = draftStatus.value;
  selectedCustomer.value = draftCustomer.value;
  selectedProduct.value = draftProduct.value;
  selectedStartDate.value = draftStartDate.value;
  selectedEndDate.value = draftEndDate.value;
  currentPage.value = 1;
  loadOrders();
}

function resetFilters() {
  draftKeyword.value = "";
  draftStatus.value = "all";
  draftCustomer.value = "all";
  draftProduct.value = "all";
  draftStartDate.value = "";
  draftEndDate.value = "";
  applyFilters();
}

async function openAddModal() {
  isPostSaveModalOpen.value = false;
  addForm.value = createDefaultOrderForm();
  nextOrderNo.value = "";
  addError.value = "";
  isAddModalOpen.value = true;

  try {
    const response = await fetchNextOrderNo();
    nextOrderNo.value = response?.orderNo || "";
    addForm.value = {
      ...addForm.value,
      orderNo: nextOrderNo.value,
    };
  } catch (err) {
    addError.value = err.message || "다음 주문번호를 불러오지 못했습니다.";
  }
}

function closeAddModal() {
  if (addLoading.value) return;
  isAddModalOpen.value = false;
}

function closePostSaveModal() {
  isPostSaveModalOpen.value = false;
}

/**
 * 목적: 주문 등록 직후 리스크/AI 검토 화면으로 이동할 때 필요한 query를 만든다.
 * 입력: lastCreatedOrder, nextOrderNo 상태.
 * 출력: router.push에 전달할 query 객체.
 * 처리 흐름:
 * 1. 생성 응답의 orderId/id/orderNo를 우선순위대로 찾는다.
 * 2. 주문 생성 흐름에서 온 진입임을 source로 표시한다.
 * 3. 주문 식별자가 있으면 문자열 orderId로 query에 포함한다.
 */
function buildRiskReviewQuery() {
  const createdOrder = lastCreatedOrder.value ?? {};
  const orderId = createdOrder.orderId || createdOrder.id || createdOrder.orderNo || nextOrderNo.value;
  const query = {
    source: "order-create",
  };

  if (orderId) {
    query.orderId = String(orderId);
  }

  return query;
}

async function handleAddMoreAfterSave() {
  closePostSaveModal();
  await openAddModal();
}

async function proceedToAiScheduleReview() {
  closePostSaveModal();
  await router.push({
    path: "/risk",
    query: buildRiskReviewQuery(),
  });
}

/**
 * 목적: 주문 등록 폼을 검증한 뒤 주문 생성 API를 호출하고 후속 모달을 연다.
 * 입력: OrderAddModal에서 전달한 form 객체.
 * 출력: 반환값 없음. 생성 결과, 목록, 모달/로딩/오류 상태를 갱신한다.
 * 처리 흐름:
 * 1. validateOrderForm으로 필수 입력을 검증한다.
 * 2. buildOrderCreatePayload로 API payload를 만든 뒤 createOrder를 호출한다.
 * 3. 성공하면 첫 페이지 목록을 다시 조회하고 저장 후 안내 모달을 연다.
 * 4. 실패하면 addError에 사용자 메시지를 저장한다.
 */
async function saveOrder(form) {
  const validationMessage = validateOrderForm(form);
  if (validationMessage) {
    addError.value = validationMessage;
    return;
  }

  addLoading.value = true;
  addError.value = "";

  try {
    const createdOrder = await createOrder(buildOrderCreatePayload(form));
    lastCreatedOrder.value = createdOrder ?? {
      orderNo: form.orderNo || nextOrderNo.value,
    };
    isAddModalOpen.value = false;
    currentPage.value = 1;
    await loadOrders();
    isPostSaveModalOpen.value = true;
  } catch (err) {
    addError.value = err.message || "주문 등록에 실패했습니다.";
  } finally {
    addLoading.value = false;
  }
}

/**
 * 목적: 선택한 주문의 상세 정보를 조회해 상세 모달에 표시한다.
 * 입력: 목록 행 또는 URL query에서 만든 주문 객체.
 * 출력: 반환값 없음. selectedOrder, detailLoading/detailError를 갱신한다.
 * 처리 흐름:
 * 1. 우선 전달받은 주문을 selectedOrder에 넣어 모달을 즉시 연다.
 * 2. fetchOrder로 상세 정보를 조회한다.
 * 3. 성공 시 normalizeOrderDetail로 상세 화면 모델을 만들고, 실패 시 오류를 표시한다.
 */
async function openDetailModal(order) {
  selectedOrder.value = order;
  detailLoading.value = true;
  detailError.value = "";

  try {
    const response = await fetchOrder(order.orderId);
    selectedOrder.value = normalizeOrderDetail(response);
  } catch (err) {
    detailError.value = err.message || "주문 상세를 불러오지 못했습니다.";
  } finally {
    detailLoading.value = false;
  }
}

async function openDetailById(orderId) {
  const resolvedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  if (!resolvedOrderId) return;

  await openDetailModal({
    orderId: resolvedOrderId,
    id: String(resolvedOrderId),
    customer: "-",
    product: "-",
    quantity: 0,
    dueDate: "",
    status: "WAITING",
  });
}

async function retryDetail() {
  if (!selectedOrder.value) return;
  await openDetailModal(selectedOrder.value);
}

function closeDetailModal() {
  selectedOrder.value = null;
}

function goToFirstPage() {
  if (currentPage.value === 1) return;
  currentPage.value = 1;
  loadOrders();
}

function goToPage(page) {
  if (page < 1 || page > pageCount.value || page === currentPage.value) return;
  currentPage.value = page;
  loadOrders();
}

function goToPrevPage() {
  if (currentPage.value === 1) return;
  currentPage.value = Math.max(1, currentPage.value - 1);
  loadOrders();
}

function goToNextPage() {
  if (currentPage.value === pageCount.value) return;
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
  loadOrders();
}

watch(pageSize, () => {
  currentPage.value = 1;
  loadOrders();
});

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) {
    currentPage.value = nextPageCount;
    loadOrders();
  }
});

watch(
  () => route.query.orderId,
  (nextOrderId) => {
    if (nextOrderId) openDetailById(nextOrderId);
  }
);

onMounted(async () => {
  await loadOrders();
  if (route.query.orderId) await openDetailById(route.query.orderId);
});
</script>

<template>
  <div class="order-management-page">
    <OrderSearchCard
      :model-value="draftKeyword"
      @update:model-value="draftKeyword = $event"
      @search="applyFilters"
    />

    <OrderTableSection
      :orders="paginatedOrders"
      :total-count="totalCount"
      :page-size="pageSize"
      :page-size-options="pageSizeOptions"
      :status-options="statusOptions"
      :customer-options="customerOptions"
      :product-options="productOptions"
      :status-meta="statusMeta"
      :selected-status="draftStatus"
      :selected-customer="draftCustomer"
      :selected-product="draftProduct"
      :start-date="draftStartDate"
      :end-date="draftEndDate"
      :current-page="currentPage"
      :page-count="pageCount"
      :visible-pages="visiblePages"
      :show-add-button="canCreateOrder"
      :loading="loading"
      :error="error"
      @open-add="openAddModal"
      @open-detail="openDetailModal"
      @update:selected-status="draftStatus = $event"
      @update:selected-customer="draftCustomer = $event"
      @update:selected-product="draftProduct = $event"
      @update:start-date="draftStartDate = $event"
      @update:end-date="draftEndDate = $event"
      @update:page-size="pageSize = $event"
      @search="applyFilters"
      @reset="resetFilters"
      @retry="loadOrders"
      @go-first-page="goToFirstPage"
      @go-prev-page="goToPrevPage"
      @go-page="goToPage"
      @go-next-page="goToNextPage"
    />

    <OrderAddModal
      v-if="isAddModalOpen"
      :initial-form="addForm"
      :next-order-no="nextOrderNo"
      :production-start-date-min="productionStartDateMin"
      :saving="addLoading"
      :error="addError"
      @update:production-start-date="addForm.productionStartDate = $event"
      @close="closeAddModal"
      @save="saveOrder"
    />

    <OrderDetailModal
      v-if="selectedOrder"
      :order="selectedOrder"
      :status-meta="statusMeta"
      :loading="detailLoading"
      :error="detailError"
      @retry="retryDetail"
      @close="closeDetailModal"
    />

    <OrderPostSaveModal
      v-if="isPostSaveModalOpen"
      @add-more="handleAddMoreAfterSave"
      @proceed="proceedToAiScheduleReview"
    />
  </div>
</template>

<style scoped>
.order-management-page {
  display: grid;
  gap: 12px;
}
</style>
