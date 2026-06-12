<script setup>
import { reactive, watch } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";
import { createDefaultOrderForm } from "../../features/orders/utils.js";

const props = defineProps({
  initialForm: {
    type: Object,
    default: () => createDefaultOrderForm(),
  },
  nextOrderNo: {
    type: String,
    default: "",
  },
  productionStartDateMin: {
    type: String,
    default: "",
  },
  saving: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close", "save", "update:productionStartDate"]);
const form = reactive(createDefaultOrderForm());

watch(
  () => props.initialForm,
  (nextForm) => {
    Object.assign(form, createDefaultOrderForm(), nextForm ?? {});
  },
  { immediate: true, deep: true }
);

function onSave() {
  emit("save", { ...form });
}

function onProductionStartDateInput(event) {
  const value = event.target.value;
  form.productionStartDate = value;
  emit("update:productionStartDate", value);
}
</script>

<template>
  <AppModal title="주문 추가하기" @close="emit('close')">
    <div class="modal-form">
      <label>
        <span>주문번호</span>
        <input
          :value="nextOrderNo || form.orderNo || '저장 시 서버에서 발급됩니다'"
          type="text"
          readonly
        />
      </label>
      <label>
        <span>고객사</span>
        <input v-model="form.customer" type="text" placeholder="A사" />
      </label>
      <label>
        <span>제품 ID</span>
        <input v-model="form.productId" type="number" min="1" placeholder="1" />
      </label>
      <label>
        <span>수량</span>
        <input v-model="form.quantity" type="number" min="1" placeholder="1000" />
      </label>
      <label>
        <span>납기일</span>
        <input v-model="form.dueDate" type="date" />
      </label>
      <label>
        <span>생산 시작일</span>
        <input
          :value="form.productionStartDate"
          type="date"
          :min="productionStartDateMin"
          @input="onProductionStartDateInput"
        />
      </label>
      <label>
        <span>생산 담당자</span>
        <input v-model="form.productionManager" type="text" placeholder="신작업" />
      </label>
      <label>
        <span>고객사 담당자</span>
        <input v-model="form.customerManager" type="text" placeholder="박고객" />
      </label>
      <label>
        <span>계약 금액</span>
        <input v-model="form.contractAmount" type="text" inputmode="numeric" placeholder="10000000" />
      </label>
      <label>
        <span>지체상금</span>
        <input v-model="form.latePenaltyAmount" type="text" inputmode="numeric" placeholder="500000" />
      </label>

      <p v-if="error" class="modal-error">{{ error }}</p>
    </div>

    <template #footer>
      <div class="modal-actions">
        <AppButton
          variant="primary"
          size="sm"
          class="modal-save"
          :disabled="saving"
          @click="onSave"
        >
          {{ saving ? "저장 중" : "저장" }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.modal-form {
  display: grid;
  gap: 10px;
}

.modal-form label {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.modal-form span {
  color: #344054;
  font-size: 13px;
  font-weight: 700;
}

.modal-form input {
  height: 36px;
  border: 1px solid #dce5f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 0 12px;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
  outline: none;
}

.modal-form input[readonly] {
  background: #f8fafc;
  color: #667085;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.modal-error {
  margin: 2px 0 0;
  border-radius: 8px;
  background: #fef3f2;
  padding: 10px 12px;
  color: #d92d20;
  font-size: 13px;
  font-weight: 800;
}

.modal-save {
  min-width: 76px;
  min-height: 36px;
  border-radius: 8px;
}

.modal-save:disabled {
  opacity: 0.6;
  cursor: default;
}

@media (max-width: 560px) {
  .modal-form label {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
