<script setup>
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";
import AppSelect from "../common/AppSelect.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";

defineProps({
  lines: { type: Array, default: () => [] },
  lineOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  statusMeta: { type: Object, required: true },
  selectedLine: { type: String, default: "all" },
  selectedStatus: { type: String, default: "all" },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: String, required: true },
  pageSizeOptions: { type: Array, default: () => [] },
  currentPage: { type: Number, default: 1 },
  pageCount: { type: Number, default: 1 },
  visiblePages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits([
  "update:selectedLine",
  "update:selectedStatus",
  "update:pageSize",
  "search",
  "retry",
  "go-first-page",
  "go-prev-page",
  "go-page",
  "go-next-page",
]);

const lineDisplayNameMap = {
  'ABS 주 생산 Line': 'ABS 주',
  'ABS 보조 생산 Line': 'ABS 보조',
  'PP 범용 생산 Line': 'PP 범용',
  'PP 기능성 생산 Line': 'PP 기능성',
  'PE 범용 생산 Line': 'PE 범용',
  'PE 특화 생산 Line': 'PE 특화',
}

function getLineDisplayName(name) {
  return lineDisplayNameMap[name] ?? name
}

</script>

<template>
  <AppCard class="section-card">
    <AppSectionHeader class="section-header-shell" title="라인별 가동 현황">
      <template #actions>
        <div class="toolbar">
          <AppSelect
            :model-value="selectedLine"
            :options="lineOptions"
            class="toolbar-select"
            @update:model-value="emit('update:selectedLine', $event)"
            @change="emit('search')"
          />

          <AppSelect
            :model-value="selectedStatus"
            :options="statusOptions"
            class="toolbar-select"
            @update:model-value="emit('update:selectedStatus', $event)"
            @change="emit('search')"
          />
        </div>
      </template>
    </AppSectionHeader>

    <div class="table-wrap">
      <table class="line-table">
        <thead>
          <tr>
            <th>라인명</th>
            <th>가동률</th>
            <th>제품명</th>
            <th>다음 생산 제품</th>
            <th>전환 예정 시간</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="table-state">라인 가동 현황을 불러오는 중입니다.</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="table-state table-state-error">
              <span>{{ error }}</span>
              <button type="button" @click="emit('retry')">다시 시도</button>
            </td>
          </tr>
          <tr v-else-if="lines.length === 0">
            <td colspan="6" class="table-state">조회된 라인이 없습니다.</td>
          </tr>
          <template v-else>
            <tr v-for="line in lines" :key="line.id">
              <td>{{ getLineDisplayName(line.name) }}</td>
              <td>{{ line.utilizationRate }}%</td>
              <td>{{ line.currentProduct }}</td>
              <td>{{ line.nextProduct }}</td>
              <td>{{ line.nextChangeEta }}</td>
              <td>
                <AppStatusBadge
                  :label="statusMeta[line.status]?.label ?? line.statusLabel ?? line.status"
                  :tone="statusMeta[line.status]?.tone ?? 'pending'"
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
          class="footer-select"
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
          :disabled="loading || currentPage >= pageCount"
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
.section-card {
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.section-header-shell {
  margin: 0 -20px 12px;
  padding: 0 26px 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-select:deep(.relative) {
  min-width: 124px;
}

.toolbar-select:deep(select) {
  height: 34px;
  min-height: 34px;
  border-radius: 8px;
  padding: 0 34px 0 12px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  box-shadow: none;
}

.toolbar-select:deep(span) {
  right: 12px;
}

.table-wrap {
  border: 1px solid #e7edf5;
  border-radius: 8px;
  margin: 0 6px;
}

.line-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
  table-layout: fixed;
}

.line-table thead th {
  padding: 12px 12px;
  background: #f8fafc;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  white-space: normal;
  word-break: keep-all;
}

.line-table tbody td {
  padding: 12px;
  border-top: 1px solid #eef2f7;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
  vertical-align: middle;
  word-break: keep-all;
}

.table-state {
  height: 124px;
  color: #667085 !important;
  text-align: center;
}

.table-state-error {
  color: #d92d20 !important;
}

.table-state-error button {
  margin-left: 10px;
  border: 0;
  background: transparent;
  color: #185ec9;
  font-weight: 800;
  cursor: pointer;
}

.line-table th:nth-child(1),
.line-table td:nth-child(1) {
  width: 13%;
}

.line-table th:nth-child(2),
.line-table td:nth-child(2) {
  width: 11%;
}

.line-table th:nth-child(3),
.line-table td:nth-child(3),
.line-table th:nth-child(4),
.line-table td:nth-child(4) {
  width: 21%;
}

.line-table th:nth-child(5),
.line-table td:nth-child(5) {
  width: 16%;
}

.line-table th:nth-child(6),
.line-table td:nth-child(6) {
  width: 18%;
}

.table-footer {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 0 6px;
}

.table-footer-left {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
}

.table-count {
  color: #667085;
  font-size: 14px;
  font-weight: 700;
}

.footer-select:deep(.relative) {
  min-width: 70px;
}

.footer-select:deep(select) {
  height: 32px;
  border-radius: 8px;
  padding: 0 28px 0 10px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: none;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-self: center;
}

.page-nav,
.page-number {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid #d8e1ec;
  border-radius: 6px;
  background: #ffffff;
  color: #667085;
  font-size: 14px;
  font-weight: 800;
}

.page-nav svg {
  width: 13px;
  height: 13px;
}

.page-number {
  border-color: transparent;
}

.page-number-active {
  background: #185ec9;
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(24, 94, 201, 0.18);
}

.page-nav:disabled,
.page-number:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 900px) {
  .table-footer {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .pagination {
    justify-self: start;
  }
}

@media (max-width: 760px) {
  .section-header-shell {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar {
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .section-card {
    padding: 12px 16px;
  }

  .section-header-shell {
    margin: 0 -16px 12px;
    padding: 0 16px 8px;
  }

  .table-wrap,
  .table-footer {
    margin: 0;
    padding: 0;
  }

  .line-table {
    table-layout: auto;
  }

  .line-table thead {
    display: none;
  }

  .line-table,
  .line-table tbody,
  .line-table tr,
  .line-table td {
    display: block;
    width: 100%;
  }

  .line-table tr {
    padding: 10px 12px;
    border-top: 1px solid #eef2f7;
  }

  .line-table tbody tr:first-child {
    border-top: 0;
  }

  .line-table td {
    padding: 6px 0;
    border-top: 0;
  }
}
</style>
