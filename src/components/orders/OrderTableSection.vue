<script setup>
import AppButton from "../common/AppButton.vue";
import AppCard from "../common/AppCard.vue";
import AppSectionHeader from "../common/AppSectionHeader.vue";
import AppSelect from "../common/AppSelect.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";
import {
  formatDateLabel,
  formatNumber,
} from "../../features/orders/utils.js";

defineProps({
  orders: { type: Array, default: () => [] },
  totalCount: { type: Number, default: 0 },
  pageSize: { type: String, required: true },
  pageSizeOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  customerOptions: { type: Array, default: () => [] },
  productOptions: { type: Array, default: () => [] },
  statusMeta: { type: Object, required: true },
  showAddButton: { type: Boolean, default: true },
  selectedStatus: { type: String, required: true },
  selectedCustomer: { type: String, required: true },
  selectedProduct: { type: String, required: true },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  currentPage: { type: Number, default: 1 },
  pageCount: { type: Number, default: 1 },
  visiblePages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits([
  "open-add",
  "open-detail",
  "update:selectedStatus",
  "update:selectedCustomer",
  "update:selectedProduct",
  "update:startDate",
  "update:endDate",
  "update:pageSize",
  "search",
  "reset",
  "retry",
  "go-first-page",
  "go-prev-page",
  "go-page",
  "go-next-page",
]);
</script>

<template>
  <AppCard class="section-card table-section">
    <AppSectionHeader class="section-header-shell table-section-header" title="전체 주문 목록">
      <template #actions>
        <AppButton
          v-if="showAddButton"
          variant="primary"
          size="sm"
          class="add-button"
          @click="emit('open-add')"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" />
          </svg>
          주문 추가하기
        </AppButton>
      </template>
    </AppSectionHeader>

    <div class="filters">
      <AppSelect
        :model-value="selectedStatus"
        :options="statusOptions"
        class="filter-select"
        @update:model-value="emit('update:selectedStatus', $event)"
      />
      <AppSelect
        :model-value="selectedCustomer"
        :options="customerOptions"
        class="filter-select"
        @update:model-value="emit('update:selectedCustomer', $event)"
      />
      <AppSelect
        :model-value="selectedProduct"
        :options="productOptions"
        class="filter-select"
        @update:model-value="emit('update:selectedProduct', $event)"
      />

      <div class="date-range">
        <input
          :value="startDate"
          type="date"
          class="date-input"
          @input="emit('update:startDate', $event.target.value)"
        />
        <span class="date-separator">-</span>
        <input
          :value="endDate"
          type="date"
          class="date-input"
          @input="emit('update:endDate', $event.target.value)"
        />
      </div>

      <div class="filter-actions">
        <AppButton variant="secondary" size="sm" class="action-button" @click="emit('reset')">
          초기화
        </AppButton>
        <AppButton variant="primary" size="sm" class="action-button" @click="emit('search')">
          검색
        </AppButton>
      </div>
    </div>

    <div class="table-wrap">
      <table class="order-table">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>고객사</th>
            <th>제품</th>
            <th>수량</th>
            <th>납기일</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="table-state">주문 목록을 불러오는 중입니다.</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="table-state table-state--error">
              <span>{{ error }}</span>
              <button type="button" @click="emit('retry')">다시 시도</button>
            </td>
          </tr>
          <tr v-else-if="orders.length === 0">
            <td colspan="6" class="table-state">조회된 주문이 없습니다.</td>
          </tr>
          <template v-else>
            <tr v-for="order in orders" :key="order.orderId ?? order.id">
              <td>
                <button type="button" class="order-link" @click="emit('open-detail', order)">
                  {{ order.id }}
                </button>
              </td>
              <td>{{ order.customer }}</td>
              <td>{{ order.product }}</td>
              <td>{{ formatNumber(order.quantity) }}</td>
              <td>{{ formatDateLabel(order.dueDate) }}</td>
              <td>
                <AppStatusBadge
                  :label="statusMeta[order.status]?.label ?? order.statusLabel ?? order.status"
                  :tone="statusMeta[order.status]?.tone ?? 'pending'"
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
          class="footer-select footer-select--count"
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
          «
        </button>
        <button
          class="page-nav"
          type="button"
          aria-label="이전 페이지"
          :disabled="loading || currentPage === 1"
          @click="emit('go-prev-page')"
        >
          ‹
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          class="page-number"
          :class="{ 'page-number--active': currentPage === page }"
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
          ›
        </button>
      </div>

      <div class="table-footer-spacer" aria-hidden="true"></div>
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

.add-button {
  min-height: 34px;
  height: 34px;
  padding-inline: 14px;
  border-color: #bfd4ff;
  box-shadow: none;
  font-size: 14px;
  font-weight: 800;
}

.add-button svg {
  width: 14px;
  height: 14px;
}

.filters {
  display: grid;
  grid-template-columns: minmax(140px, 0.9fr) minmax(140px, 0.9fr) minmax(140px, 0.9fr) minmax(260px, 1.2fr) auto;
  gap: 10px;
  margin-bottom: 14px;
}

.filter-select:deep(.relative) {
  min-width: 0;
}

.filter-select:deep(select) {
  height: 34px;
  min-height: 34px;
  border-radius: 8px;
  padding: 0 34px 0 12px;
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  box-shadow: none;
}

.filter-select:deep(span) {
  right: 12px;
}

.filter-select:deep(svg) {
  width: 14px;
  height: 14px;
}

.date-range {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
}

.date-input {
  width: 100%;
  height: 34px;
  border: 1px solid #dce5f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 12px;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  box-shadow: none;
  outline: none;
}

.date-separator {
  color: #98a2b3;
  font-size: 14px;
  font-weight: 700;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.action-button {
  min-height: 34px;
  height: 34px;
  min-width: 72px;
  box-shadow: none;
  font-size: 14px;
  font-weight: 800;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e7edf5;
  border-radius: 8px;
}

.order-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  background: #ffffff;
}

.order-table thead th {
  padding: 12px 16px;
  background: #f8fafc;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  white-space: nowrap;
}

.order-table tbody td {
  padding: 12px 16px;
  border-top: 1px solid #eef2f7;
  color: #344054;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.order-link {
  border: 0;
  background: transparent;
  padding: 0;
  color: #2f62c9;
  font-size: 14px;
  font-weight: 800;
}

.table-state {
  height: 124px;
  padding: 32px 16px !important;
  color: #98a2b3 !important;
  text-align: center;
}

.table-state--error {
  color: #d92d20 !important;
}

.table-state--error button {
  margin-left: 10px;
  border: 0;
  background: transparent;
  color: #185ec9;
  font-weight: 800;
  cursor: pointer;
}

.table-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
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

.page-number {
  border-color: transparent;
}

.page-number--active {
  background: #185ec9;
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(24, 94, 201, 0.18);
}

.page-nav:disabled,
.page-number:disabled {
  opacity: 0.45;
  cursor: default;
}

.footer-select:deep(.relative) {
  min-width: 70px;
}

.footer-select--count:deep(select) {
  height: 32px;
  min-height: 32px;
  border-radius: 8px;
  padding: 0 28px 0 10px;
  font-size: 14px;
  font-weight: 700;
  border-color: #dce5f0;
  box-shadow: none;
}

.footer-select--count:deep(span) {
  right: 10px;
}

.footer-select--count:deep(svg) {
  width: 14px;
  height: 14px;
}

.table-footer-spacer {
  justify-self: end;
  width: 70px;
  height: 32px;
}

@media (max-width: 1180px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .table-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filters {
    grid-template-columns: 1fr;
  }

  .table-footer {
    grid-template-columns: 1fr;
    justify-items: start;
  }

  .table-footer-left {
    gap: 12px;
  }

  .pagination {
    justify-self: start;
  }

  .table-footer-spacer {
    display: none;
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

  .date-range {
    grid-template-columns: 1fr;
  }

  .date-separator {
    display: none;
  }
}
</style>
