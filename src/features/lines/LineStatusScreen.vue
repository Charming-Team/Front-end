<script setup>
import { computed, ref, watch } from "vue";
import LineCompositionChart from "../../components/lines/LineCompositionChart.vue";
import LineOperatingTable from "../../components/lines/LineOperatingTable.vue";
import LineOrderDistributionSection from "../../components/lines/LineOrderDistributionSection.vue";
import LineSearchBar from "../../components/lines/LineSearchBar.vue";
import {
  lineItems,
  lineStatusMeta,
  lineStatusOptions,
  pageSizeOptions,
  productionOrders,
} from "./mockData.js";
import {
  buildLineOptions,
  getVisiblePages,
} from "./utils.js";

const pageSize = ref("5");
const currentPage = ref(1);

const draftLine = ref("all");
const draftStatus = ref("all");

const selectedLine = ref("all");
const selectedStatus = ref("all");

const draftOrderKeyword = ref("");
const orderKeyword = ref("");

const lineOptions = computed(() => buildLineOptions(lineItems));

const filteredLines = computed(() =>
  lineItems.filter((item) => {
    const matchesLine = selectedLine.value === "all" || item.id === selectedLine.value;
    const matchesStatus =
      selectedStatus.value === "all" || item.status === selectedStatus.value;

    return matchesLine && matchesStatus;
  })
);

const totalCount = computed(() => filteredLines.value.length);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredLines.value.length / Number(pageSize.value)))
);
const visiblePages = computed(() =>
  getVisiblePages(currentPage.value, pageCount.value)
);
const paginatedLines = computed(() => {
  const size = Number(pageSize.value);
  const start = (currentPage.value - 1) * size;
  return filteredLines.value.slice(start, start + size);
});

const filteredOrders = computed(() => {
  const keyword = orderKeyword.value.trim().toLowerCase();

  return productionOrders.filter((order) => {
    const lineNames = order.lineDetails.map((item) => item.lineName);
    const matchesKeyword =
      !keyword ||
      [order.id, order.product, ...lineNames].some((value) =>
        String(value).toLowerCase().includes(keyword)
      );

    return matchesKeyword;
  });
});

function applyLineFilters() {
  selectedLine.value = draftLine.value;
  selectedStatus.value = draftStatus.value;
  currentPage.value = 1;
}

function applyOrderSearch() {
  orderKeyword.value = draftOrderKeyword.value;
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
  if (currentPage.value > nextPageCount) {
    currentPage.value = nextPageCount;
  }
});
</script>

<template>
  <div class="line-status-page">
    <div class="line-status-page__top">
      <LineOperatingTable
        :lines="paginatedLines"
        :line-options="lineOptions"
        :status-options="lineStatusOptions"
        :status-meta="lineStatusMeta"
        :selected-line="draftLine"
        :selected-status="draftStatus"
        :total-count="totalCount"
        :page-size="pageSize"
        :page-size-options="pageSizeOptions"
        :current-page="currentPage"
        :visible-pages="visiblePages"
        @update:selected-line="draftLine = $event"
        @update:selected-status="draftStatus = $event"
        @update:page-size="pageSize = $event"
        @search="applyLineFilters"
        @go-first-page="goToFirstPage"
        @go-prev-page="goToPrevPage"
        @go-page="goToPage"
        @go-next-page="goToNextPage"
      />

      <LineCompositionChart :items="filteredLines" />
    </div>

    <LineSearchBar
      :keyword="draftOrderKeyword"
      @update:keyword="draftOrderKeyword = $event"
      @search="applyOrderSearch"
    />

    <LineOrderDistributionSection
      v-for="order in filteredOrders"
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

.line-status-page__top {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(360px, 1fr);
  gap: 12px;
}

@media (max-width: 1180px) {
  .line-status-page__top {
    grid-template-columns: 1fr;
  }
}
</style>
