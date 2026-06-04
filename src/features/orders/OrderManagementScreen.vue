<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import OrderAddModal from "../../components/orders/OrderAddModal.vue";
import OrderDetailModal from "../../components/orders/OrderDetailModal.vue";
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
const addForm = ref(createDefaultOrderForm());
const nextOrderNo = ref("");
const addLoading = ref(false);
const addError = ref("");
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

async function saveOrder(form) {
  const validationMessage = validateOrderForm(form);
  if (validationMessage) {
    addError.value = validationMessage;
    return;
  }

  addLoading.value = true;
  addError.value = "";

  try {
    await createOrder(buildOrderCreatePayload(form));
    isAddModalOpen.value = false;
    currentPage.value = 1;
    await loadOrders();
  } catch (err) {
    addError.value = err.message || "주문 등록에 실패했습니다.";
  } finally {
    addLoading.value = false;
  }
}

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
  </div>
</template>

<style scoped>
.order-management-page {
  display: grid;
  gap: 12px;
}
</style>
