<script setup>
import AppButton from "../common/AppButton.vue";
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";
import AppSelect from "../common/AppSelect.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";
import { formatMaterialQuantity } from "../../features/materials/utils.js";

defineProps({
  materials: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: String, required: true },
  pageSizeOptions: { type: Array, default: () => [] },
  showRegisterButton: { type: Boolean, default: true },
  statusOptions: { type: Array, default: () => [] },
  statusMeta: { type: Object, required: true },
  selectedStatus: { type: String, required: true },
  currentPage: { type: Number, default: 1 },
  visiblePages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits([
  "open-register",
  "update:selectedStatus",
  "update:pageSize",
  "retry",
  "go-first-page",
  "go-prev-page",
  "go-page",
  "go-next-page",
]);
</script>

<template>
  <AppCard class="section-card table-section">
    <AppSectionHeader class="section-header-shell table-section-header" title="자재 목록">
      <template #actions>
        <div class="toolbar">
          <AppButton
            v-if="showRegisterButton"
            variant="surface"
            size="sm"
            class="add-button"
            @click="emit('open-register')"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
            </svg>
            자재 목록 추가하기
          </AppButton>

          <AppSelect
            :model-value="selectedStatus"
            :options="statusOptions"
            class="toolbar-select"
            @update:model-value="emit('update:selectedStatus', $event)"
          />
        </div>
      </template>
    </AppSectionHeader>

    <div class="table-wrap">
      <table class="material-table">
        <thead>
          <tr>
            <th>자재 ID</th>
            <th>자재명</th>
            <th>자재 유형</th>
            <th>가용 재고</th>
            <th>예약 재고</th>
            <th>현재 재고</th>
            <th>안전 재고</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="8" class="table-state">자재 목록을 불러오는 중입니다.</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="8" class="table-state table-state-error">
              <span>{{ error }}</span>
              <button type="button" @click="emit('retry')">다시 시도</button>
            </td>
          </tr>
          <tr v-else-if="materials.length === 0">
            <td colspan="8" class="table-state">조회된 자재가 없습니다.</td>
          </tr>
          <template v-else>
            <tr v-for="material in materials" :key="material.materialId">
              <td>{{ material.id }}</td>
              <td>{{ material.name }}</td>
              <td>{{ material.type }}</td>
              <td>{{ formatMaterialQuantity(material.availableStock, material.unit) }}</td>
              <td>{{ formatMaterialQuantity(material.reservedStock, material.unit) }}</td>
              <td>{{ formatMaterialQuantity(material.currentStock, material.unit) }}</td>
              <td>{{ formatMaterialQuantity(material.safeStock, material.unit) }}</td>
              <td>
                <AppStatusBadge
                  :label="statusMeta[material.status]?.label ?? material.status"
                  :tone="statusMeta[material.status]?.tone ?? 'pending'"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <div class="table-footer-left">
        <span class="table-count">전체 {{ totalCount }}건</span>
        <AppSelect
          :model-value="pageSize"
          :options="pageSizeOptions"
          class="footer-select footer-select-count"
          @update:model-value="emit('update:pageSize', $event)"
        />
      </div>

      <div class="pagination">
        <button
          class="page-nav"
          type="button"
          aria-label="첫 페이지"
          :disabled="loading || currentPage === 1"
          @click="emit('go-first-page')"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 5 8 10l4.5 5M8 5 3.5 10 8 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          class="page-nav"
          type="button"
          aria-label="이전 페이지"
          :disabled="loading || currentPage === 1"
          @click="emit('go-prev-page')"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M11.5 5 7 10l4.5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-number"
          :class="{ 'page-number-active': currentPage === page }"
          type="button"
          :disabled="loading"
          @click="emit('go-page', page)"
        >
          {{ page }}
        </button>

        <button
          class="page-nav"
          type="button"
          aria-label="다음 페이지"
          :disabled="loading || currentPage === visiblePages.at(-1)"
          @click="emit('go-next-page')"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m8.5 5 4.5 5-4.5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  </AppCard>
</template>

<style scoped>
.section-card { padding: 12px 20px; border-radius: 12px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); }
.section-header-shell { margin: 0 -20px 12px; padding: 0 26px 8px; }
.toolbar { display: flex; align-items: center; gap: 8px; }
.add-button { min-height: 34px; border-color: #bfd4ff; color: #1458c0; font-size: 14px; font-weight: 800; box-shadow: none; }
.add-button svg { width: 14px; height: 14px; }
.toolbar-select:deep(.relative) { min-width: 124px; }
.toolbar-select:deep(select) { height: 34px; min-height: 34px; border-radius: 8px; padding: 0 34px 0 12px; font-size: 14px; font-weight: 800; line-height: 1; box-shadow: none; }
.toolbar-select:deep(span) { right: 12px; }
.toolbar-select:deep(svg) { width: 14px; height: 14px; }
.table-wrap { overflow-x: auto; border: 1px solid #e7edf5; border-radius: 8px; margin: 0 6px; }
.material-table { width: 100%; min-width: 960px; border-collapse: collapse; background: #ffffff; }
.material-table thead th { padding: 12px 16px; background: #f8fafc; color: #475467; font-size: 13px; font-weight: 800; text-align: left; white-space: nowrap; }
.material-table tbody td { padding: 12px 16px; border-top: 1px solid #eef2f7; color: #344054; font-size: 14px; font-weight: 600; white-space: nowrap; }
.table-state { height: 124px; color: #667085; text-align: center; }
.table-state-error { color: #d92d20; }
.table-state-error button { margin-left: 10px; border: 0; background: transparent; color: #185ec9; font-weight: 800; cursor: pointer; }
.table-footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; margin-top: 12px; padding: 0 6px; }
.table-footer-left { display: flex; align-items: center; gap: 10px; justify-self: start; }
.table-count { color: #667085; font-size: 14px; font-weight: 700; }
.footer-select:deep(.relative) { min-width: 70px; }
.footer-select-count:deep(select) { height: 32px; border-radius: 8px; padding: 0 28px 0 10px; font-size: 14px; font-weight: 700; box-shadow: none; }
.pagination { display: flex; align-items: center; gap: 6px; grid-column: 2; justify-self: center; }
.page-nav, .page-number { display: grid; place-items: center; width: 28px; height: 28px; border: 1px solid #d8e1ec; border-radius: 6px; background: #ffffff; color: #667085; font-size: 14px; font-weight: 800; }
.page-nav svg { width: 13px; height: 13px; }
.page-number { border-color: transparent; }
.page-number-active { background: #185ec9; color: #ffffff; box-shadow: 0 6px 14px rgba(24, 94, 201, 0.18); }
.page-nav:disabled, .page-number:disabled { opacity: 0.45; cursor: default; }
@media (max-width: 900px) { .table-footer { grid-template-columns: 1fr; justify-items: start; } .pagination { justify-self: start; } }
@media (max-width: 760px) { .table-section-header { flex-direction: column; align-items: stretch; } .toolbar { flex-wrap: wrap; } }
@media (max-width: 560px) { .section-card { padding: 12px 16px; } .section-header-shell { margin: 0 -16px 12px; padding: 0 16px 8px; } .table-wrap, .table-footer { margin: 0; padding: 0; } }
</style>
