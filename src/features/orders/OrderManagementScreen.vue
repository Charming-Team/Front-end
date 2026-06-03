<script setup>
import { computed, ref, watch } from "vue";
import OrderAddModal from "../../components/orders/OrderAddModal.vue";
import OrderDetailModal from "../../components/orders/OrderDetailModal.vue";
import OrderSearchCard from "../../components/orders/OrderSearchCard.vue";
import OrderTableSection from "../../components/orders/OrderTableSection.vue";
import {
  initialOrders,
  pageSizeOptions,
  statusMeta,
  statusOptions,
} from "./mockData.js";
import { getProductionStartDateMinDate } from "./productionAvailability.js";
import {
  buildSelectOptions,
  createDefaultOrderForm,
  createOrderFromForm,
  getVisiblePages,
  matchesDateRange,
} from "./utils.js";

const orders = ref([...initialOrders]);
const pageSize = ref("10");
const currentPage = ref(1);

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
const selectedOrder = ref(null);

const customerOptions = computed(() => buildSelectOptions(orders.value, "customer", "고객사 전체"));
const productOptions = computed(() => buildSelectOptions(orders.value, "product", "제품 전체"));
const productFormOptions = computed(() =>
  [...new Set(orders.value.map((order) => order.product).filter(Boolean))].map((product) => ({
    value: product,
    label: product,
  }))
);
const productionStartDateMin = computed(() => getProductionStartDateMinDate());

const filteredOrders = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return orders.value.filter((order) => {
    const matchesKeyword =
      !keyword ||
      [order.id, order.customer, order.product].some((value) =>
        String(value).toLowerCase().includes(keyword)
      );

    const matchesStatus =
      selectedStatus.value === "all" || order.status === selectedStatus.value;
    const matchesCustomer =
      selectedCustomer.value === "all" || order.customer === selectedCustomer.value;
    const matchesProduct =
      selectedProduct.value === "all" || order.product === selectedProduct.value;
    const matchesDueDate = matchesDateRange(
      order.dueDate,
      selectedStartDate.value,
      selectedEndDate.value
    );

    return (
      matchesKeyword &&
      matchesStatus &&
      matchesCustomer &&
      matchesProduct &&
      matchesDueDate
    );
  });
});

const totalCount = computed(() => filteredOrders.value.length);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredOrders.value.length / Number(pageSize.value)))
);
const visiblePages = computed(() => getVisiblePages(currentPage.value, pageCount.value));
const paginatedOrders = computed(() => {
  const size = Number(pageSize.value);
  const start = (currentPage.value - 1) * size;
  return filteredOrders.value.slice(start, start + size);
});

function applyFilters() {
  searchQuery.value = draftKeyword.value;
  selectedStatus.value = draftStatus.value;
  selectedCustomer.value = draftCustomer.value;
  selectedProduct.value = draftProduct.value;
  selectedStartDate.value = draftStartDate.value;
  selectedEndDate.value = draftEndDate.value;
  currentPage.value = 1;
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

function openAddModal() {
  addForm.value = createDefaultOrderForm();
  isAddModalOpen.value = true;
}

function closeAddModal() {
  isAddModalOpen.value = false;
}

function saveOrder(form) {
  const newOrder = createOrderFromForm(form, orders.value.length);
  orders.value = [newOrder, ...orders.value];
  closeAddModal();
  applyFilters();
}

function openDetailModal(order) {
  selectedOrder.value = order;
}

function closeDetailModal() {
  selectedOrder.value = null;
}

function goToFirstPage() {
  currentPage.value = 1;
}

function goToPage(page) {
  currentPage.value = page;
}

function goToPrevPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goToNextPage() {
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
}

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) currentPage.value = nextPageCount;
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
      :visible-pages="visiblePages"
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
      @go-first-page="goToFirstPage"
      @go-prev-page="goToPrevPage"
      @go-page="goToPage"
      @go-next-page="goToNextPage"
    />

    <OrderAddModal
      v-if="isAddModalOpen"
      :initial-form="addForm"
      :product-options="productFormOptions"
      :production-start-date-min="productionStartDateMin"
      @update:production-start-date="addForm.productionStartDate = $event"
      @close="closeAddModal"
      @save="saveOrder"
    />

    <OrderDetailModal
      v-if="selectedOrder"
      :order="selectedOrder"
      :status-meta="statusMeta"
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
