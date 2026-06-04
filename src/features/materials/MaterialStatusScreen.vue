<script setup>
import { computed, onMounted, ref, watch } from "vue";
import MaterialInventoryOverview from "../../components/materials/MaterialInventoryOverview.vue";
import MaterialSearchCard from "../../components/materials/MaterialSearchCard.vue";
import MaterialTableSection from "../../components/materials/MaterialTableSection.vue";
import {
  pageSizeOptions,
  statusMeta,
  statusOptions,
} from "./mockData.js";
import { fetchMaterials } from "./api.js";
import { formatMaterialType } from "./utils.js";

const searchQuery = ref("");
const selectedStatus = ref("all");
const pageSize = ref("10");
const currentPage = ref(1);
const materials = ref([]);
const loading = ref(false);
const error = ref("");
const inventoryStatusOrder = ["SHORTAGE", "LOW", "INBOUND_WAITING"];

const inventoryCards = computed(() =>
  [...materials.value]
    .filter((material) => material.status !== "NORMAL")
    .sort(
      (left, right) =>
        inventoryStatusOrder.indexOf(left.status) -
        inventoryStatusOrder.indexOf(right.status)
    )
);

const filteredMaterials = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return materials.value.filter((material) => {
    const searchableValues = [
      material.id,
      material.materialId,
      material.name,
      material.type,
      material.typeCode,
      material.description,
    ];
    const matchesKeyword =
      !keyword ||
      searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

    const matchesStatus =
      selectedStatus.value === "all" || material.status === selectedStatus.value;

    return matchesKeyword && matchesStatus;
  });
});

const totalCount = computed(() => filteredMaterials.value.length);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filteredMaterials.value.length / Number(pageSize.value)))
);
const visiblePages = computed(() => {
  const total = pageCount.value;
  const current = currentPage.value;
  const start = Math.max(1, Math.min(current - 2, total - 4));
  const end = Math.min(total, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
const paginatedMaterials = computed(() => {
  const size = Number(pageSize.value);
  const start = (currentPage.value - 1) * size;
  return filteredMaterials.value.slice(start, start + size);
});

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeMaterialStatus(material) {
  if (material.inventoryStatus) return material.inventoryStatus;
  return material.inventoryRegistered ? "NORMAL" : "INBOUND_WAITING";
}

function normalizeLevelLabel(currentStock, safeStock) {
  if (!safeStock) return "0%";
  return `${Math.round((currentStock / safeStock) * 100)}%`;
}

function normalizeMaterial(material) {
  const currentStock = toNumber(material.currentQuantity);
  const safeStock = toNumber(material.safetyStockQuantity);

  return {
    materialId: material.materialId,
    id: material.materialCode || String(material.materialId),
    name: material.materialName || "-",
    type: formatMaterialType(material.materialType),
    typeCode: material.materialType || "",
    unit: material.unit || "",
    description: material.description || "-",
    currentStock,
    availableStock: toNumber(material.availableQuantity),
    reservedStock: toNumber(material.reservedQuantity),
    safeStock,
    levelLabel: normalizeLevelLabel(currentStock, safeStock),
    status: normalizeMaterialStatus(material),
  };
}

async function loadMaterials() {
  loading.value = true;
  error.value = "";

  try {
    const response = await fetchMaterials({ page: 0, size: 100 });
    const content = Array.isArray(response?.content) ? response.content : [];
    materials.value = content.map(normalizeMaterial);
  } catch (err) {
    materials.value = [];
    error.value = err.message || "자재 목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

function goToFirstPage() {
  currentPage.value = 1;
}

function goToPage(page) {
  if (page < 1 || page > pageCount.value || page === currentPage.value) return;
  currentPage.value = page;
}

function goToPrevPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goToNextPage() {
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
}

onMounted(loadMaterials);

watch([searchQuery, selectedStatus, pageSize], () => {
  currentPage.value = 1;
});

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) currentPage.value = nextPageCount;
});
</script>

<template>
  <div class="material-status-page">
    <MaterialSearchCard v-model="searchQuery" />

    <MaterialInventoryOverview
      :items="inventoryCards"
      :status-meta="statusMeta"
    />

    <MaterialTableSection
      :materials="paginatedMaterials"
      :total-count="totalCount"
      :page-size="pageSize"
      :page-size-options="pageSizeOptions"
      :show-register-button="false"
      :status-options="statusOptions"
      :status-meta="statusMeta"
      :selected-status="selectedStatus"
      :current-page="currentPage"
      :visible-pages="visiblePages"
      :loading="loading"
      :error="error"
      @retry="loadMaterials"
      @update:selected-status="selectedStatus = $event"
      @update:page-size="pageSize = $event"
      @go-first-page="goToFirstPage"
      @go-prev-page="goToPrevPage"
      @go-page="goToPage"
      @go-next-page="goToNextPage"
    />
  </div>
</template>

<style scoped>
.material-status-page {
  display: grid;
  gap: 12px;
}
</style>
