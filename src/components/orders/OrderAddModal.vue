<script setup>
import { reactive, watch } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";
import AppSelect from "../common/AppSelect.vue";
import { createDefaultOrderForm } from "../../features/orders/utils.js";

const props = defineProps({
  initialForm: {
    type: Object,
    default: () => createDefaultOrderForm(),
  },
  productOptions: {
    type: Array,
    default: () => [],
  },
  productionStartDateMin: {
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
        <input v-model="form.id" type="text" placeholder="ORD-198" />
      </label>
      <label>
        <span>고객사</span>
        <input v-model="form.customer" type="text" placeholder="A사" />
      </label>
      <label>
        <span>제품</span>
        <AppSelect
          :model-value="form.product"
          :options="productOptions"
          class="modal-select"
          @update:model-value="form.product = $event"
        />
      </label>
      <label>
        <span>수량</span>
        <input v-model="form.quantity" type="text" placeholder="1000" />
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
        <input v-model="form.productionManager" type="text" placeholder="윤정원" />
      </label>
      <label>
        <span>고객사 담당자</span>
        <input v-model="form.customerManager" type="text" placeholder="배난수" />
      </label>
    </div>

    <template #footer>
      <div class="modal-actions">
        <AppButton variant="primary" size="sm" class="modal-save" @click="onSave">저장</AppButton>
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

.modal-select:deep(.relative) {
  min-width: 0;
}

.modal-select:deep(select) {
  height: 36px;
  min-height: 36px;
  border-radius: 8px;
  padding: 0 36px 0 12px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: none;
}

.modal-select:deep(span) {
  right: 12px;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.modal-save {
  min-width: 76px;
  min-height: 36px;
  border-radius: 8px;
}

@media (max-width: 560px) {
  .modal-form label {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
