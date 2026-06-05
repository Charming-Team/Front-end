<script setup>
import { computed } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";
import AppStatusBadge from "../common/AppStatusBadge.vue";
import {
  formatCurrency,
  formatDateLabel,
  formatDateTimeLabel,
  formatDurationHours,
  formatNumber,
} from "../../features/orders/utils.js";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
  statusMeta: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "retry"]);

const status = computed(() => props.statusMeta[props.order.status] ?? {
  label: props.order.statusLabel || props.order.status,
  tone: "pending",
});

const summaryText = computed(() =>
  props.order.priorityMessage ||
  (props.order.priority && props.order.priority <= 1
    ? "우선 대응이 필요한 주문입니다."
    : "일정에 맞춰 관리 중인 주문입니다.")
);

const primaryRows = computed(() => [
  { label: "주문번호", value: props.order.id },
  { label: "고객사", value: props.order.customer },
  { label: "제품", value: props.order.product },
  { label: "제품 코드", value: props.order.productCode || "-" },
  { label: "수량", value: formatNumber(props.order.quantity) },
  { label: "주문일", value: formatDateLabel(props.order.orderDate) },
  { label: "납기일", value: formatDateLabel(props.order.dueDate) },
]);

const secondaryRows = computed(() => [
  { label: "계획 시작", value: formatDateTimeLabel(props.order.plannedStartAt) },
  { label: "계획 종료", value: formatDateTimeLabel(props.order.plannedEndAt) },
  { label: "예상 소요시간", value: formatDurationHours(props.order.estimatedDurationHr) },
  { label: "생산 라인", value: props.order.lineNames || "-" },
  { label: "생산 담당자", value: props.order.productionManager },
  { label: "고객사 담당자", value: props.order.customerManager },
  { label: "계약 금액", value: formatCurrency(props.order.contractAmount) },
  { label: "지체상금", value: formatCurrency(props.order.latePenaltyAmount) },
]);
</script>

<template>
  <AppModal title="주문 상세" @close="emit('close')">
    <div v-if="loading" class="modal-state">주문 상세를 불러오는 중입니다.</div>

    <div v-else-if="error" class="modal-state modal-state--error">
      <span>{{ error }}</span>
      <button type="button" @click="emit('retry')">다시 시도</button>
    </div>

    <template v-else>
    <div class="summary-card">
      <div class="summary-top">
        <div class="summary-title-block">
          <p class="summary-eyebrow">Order Overview</p>
          <strong class="summary-order-id">{{ order.id }}</strong>
        </div>

        <AppStatusBadge
          :label="status.label"
          :tone="status.tone"
        />
      </div>

      <div class="summary-meta">
        <div v-if="order.priority" class="meta-chip">
          <span class="meta-chip__label">우선순위</span>
          <span class="priority-chip">{{ order.priority }}</span>
        </div>
        <p class="summary-text">{{ summaryText }}</p>
      </div>
    </div>

    <div class="detail-panels">
      <section class="detail-panel">
        <h4 class="detail-panel__title">기본 정보</h4>
        <div class="detail-grid">
          <div v-for="row in primaryRows" :key="row.label" class="detail-row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </div>
      </section>

      <section class="detail-panel">
        <h4 class="detail-panel__title">진행 정보</h4>
        <div class="detail-grid">
          <div v-for="row in secondaryRows" :key="row.label" class="detail-row">
            <dt>{{ row.label }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </div>
      </section>
    </div>
    </template>

    <template #footer>
      <div class="modal-actions">
        <AppButton variant="primary" size="sm" class="close-button" @click="emit('close')">닫기</AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.summary-card {
  padding: 16px 18px;
  border: 1px solid #e7edf5;
  border-radius: 14px;
  background: #ffffff;
}

.modal-state {
  display: grid;
  min-height: 180px;
  place-items: center;
  color: #667085;
  font-size: 14px;
  font-weight: 800;
}

.modal-state--error {
  gap: 10px;
  color: #d92d20;
}

.modal-state--error button {
  border: 0;
  background: transparent;
  color: #185ec9;
  font-weight: 800;
  cursor: pointer;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.summary-title-block {
  display: grid;
  gap: 4px;
}

.summary-eyebrow {
  margin: 0;
  color: #2f62c9;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-order-id {
  color: #0f172a;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}

.summary-meta {
  display: grid;
  gap: 10px;
  margin-top: 14px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.meta-chip__label {
  color: #475467;
  font-size: 12px;
  font-weight: 800;
}

.priority-chip {
  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #ff1744;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.summary-text {
  margin: 0;
  color: #667085;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.detail-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.detail-panel {
  padding: 16px;
  border: 1px solid #edf2f7;
  border-radius: 14px;
  background: #ffffff;
}

.detail-panel__title {
  margin: 0 0 14px;
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.detail-grid {
  display: grid;
  gap: 12px;
}

.detail-row {
  display: grid;
  gap: 6px;
}

.detail-row dt {
  margin: 0;
  color: #667085;
  font-size: 12px;
  font-weight: 800;
}

.detail-row dd {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.close-button {
  min-width: 72px;
}

@media (max-width: 560px) {
  .summary-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .detail-panels {
    grid-template-columns: 1fr;
  }
}
</style>
