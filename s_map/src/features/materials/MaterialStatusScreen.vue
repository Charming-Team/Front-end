<script setup>
import { computed, ref, watch } from "vue";
import MaterialInventoryOverview from "../../components/materials/MaterialInventoryOverview.vue";
import MaterialSearchCard from "../../components/materials/MaterialSearchCard.vue";
import MaterialTableSection from "../../components/materials/MaterialTableSection.vue";
import MaterialAddModal from "./MaterialAddModal.vue";
import {
  initialMaterials,
  inventoryCardIds,
  materialCatalog,
  mockServerMaterialDefaults,
  pageSizeOptions,
  statusMeta,
  statusOptions,
} from "./mockData.js";
import {
  createDefaultForm,
  parseNumber,
} from "./utils.js";

const searchQuery = ref("");
const selectedStatus = ref("all");
const pageSize = ref("10");
const currentPage = ref(1);
const isRegisterModalOpen = ref(false);
const registerForm = ref(createDefaultForm());
const materials = ref([...initialMaterials]);

const inventoryCards = computed(() =>
  inventoryCardIds
    .map((id) => materials.value.find((material) => material.id === id))
    .filter(Boolean)
);

const filteredMaterials = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  return materials.value.filter((material) => {
    const matchesKeyword =
      !keyword ||
      [material.id, material.name, material.product].some((value) =>
        String(value).toLowerCase().includes(keyword)
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
const visiblePages = computed(() =>
  Array.from({ length: pageCount.value }, (_, index) => index + 1)
);
const paginatedMaterials = computed(() => {
  const size = Number(pageSize.value);
  const start = (currentPage.value - 1) * size;
  return filteredMaterials.value.slice(start, start + size);
});

function openRegisterModal() {
  registerForm.value = createDefaultForm();
  isRegisterModalOpen.value = true;
}

function closeRegisterModal() {
  isRegisterModalOpen.value = false;
}

function saveMaterial(form) {
  const nextId =
    form.id.trim() || `New-${String(materials.value.length + 1).padStart(3, "0")}`;
  const incomingStock = parseNumber(form.incomingStock);
  const existingMaterial = materials.value.find((material) => material.id === nextId);
  const currentStock = (existingMaterial?.currentStock ?? 0) + incomingStock;

  const nextMaterial = {
    id: nextId,
    name: form.name.trim() || "신규 자재",
    product: form.product.trim() || "-",
    currentStock,
    depletionDate: existingMaterial?.depletionDate ?? mockServerMaterialDefaults.depletionDate,
    safeStock: existingMaterial?.safeStock ?? mockServerMaterialDefaults.safeStock,
    levelLabel: existingMaterial?.levelLabel ?? mockServerMaterialDefaults.levelLabel,
    status: existingMaterial?.status ?? mockServerMaterialDefaults.status,
    orderCost: parseNumber(form.orderCost),
  };

  const existingIndex = materials.value.findIndex((material) => material.id === nextMaterial.id);

  if (existingIndex >= 0) {
    materials.value = materials.value.map((material, index) =>
      index === existingIndex ? { ...material, ...nextMaterial } : material
    );
  } else {
    materials.value = [nextMaterial, ...materials.value];
  }

  currentPage.value = 1;
  closeRegisterModal();
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
      @open-register="openRegisterModal"
      @update:selected-status="selectedStatus = $event"
      @update:page-size="pageSize = $event"
      @go-first-page="goToFirstPage"
      @go-prev-page="goToPrevPage"
      @go-page="goToPage"
      @go-next-page="goToNextPage"
    />

    <MaterialAddModal
      v-if="isRegisterModalOpen"
      :catalog="materialCatalog"
      :initial-form="registerForm"
      @close="closeRegisterModal"
      @save="saveMaterial"
    />
  </div>
</template>

<style scoped>
.material-status-page {
  display: grid;
  gap: 12px;
}
</style>
