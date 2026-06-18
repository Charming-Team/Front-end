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

/**
 * 목적: 자재 API 응답을 재고 현황 테이블/카드 공통 표시 모델로 변환한다.
 * 입력: 백엔드 자재 객체.
 * 출력: 자재 식별자, 유형, 수량, 안전재고 비율, 상태를 담은 화면 모델.
 * 처리 흐름:
 * 1. current/safety/available/reserved 수량을 숫자로 보정한다.
 * 2. 코드/이름/유형/단위/설명 필드를 화면 표시명으로 매핑한다.
 * 3. 안전재고 대비 현재고 비율 라벨과 재고 상태 코드를 계산한다.
 */
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

/**
 * 목적: 자재 목록을 조회해 검색/페이지네이션의 원본 데이터를 채운다.
 * 입력: 없음. 현재 화면은 전체 100건을 한 번에 조회한다.
 * 출력: 반환값 없음. materials, loading/error 상태를 갱신한다.
 * 처리 흐름:
 * 1. fetchMaterials로 자재 목록을 조회한다.
 * 2. 응답 content 배열을 normalizeMaterial로 화면 모델에 맞춘다.
 * 3. 실패하면 목록을 비우고 사용자 메시지를 error에 저장한다.
 */
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
