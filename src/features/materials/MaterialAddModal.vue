<script setup>
import { reactive, watch } from "vue";
import AppButton from "../../components/common/AppButton.vue";
import AppModal from "../../components/common/AppModal.vue";
import { createDefaultForm, findCatalogMatch } from "./utils.js";

const props = defineProps({
  catalog: { type: Array, default: () => [] },
  initialForm: { type: Object, default: () => createDefaultForm() },
});

const emit = defineEmits(["close", "save"]);
const form = reactive(createDefaultForm());

watch(
  () => props.initialForm,
  (nextForm) => {
    Object.assign(form, createDefaultForm(), nextForm ?? {});
  },
  { immediate: true, deep: true }
);

function autofillMaterialFields(changedField) {
  const match = findCatalogMatch(props.catalog, changedField, form[changedField]);
  if (!match) return;
  Object.assign(form, { id: match.id, name: match.name, product: match.product });
}

function onSave() {
  emit("save", { ...form });
}
</script>

<template>
  <AppModal title="자재 목록 추가하기" @close="emit('close')">
    <div class="modal-form">
      <label>
        <span>자재 ID</span>
        <input v-model="form.id" type="text" placeholder="Re-001" @input="autofillMaterialFields('id')" />
      </label>
      <label>
        <span>자재명</span>
        <input v-model="form.name" type="text" placeholder="ABS Resin" @input="autofillMaterialFields('name')" />
      </label>
      <label>
        <span>관련 제품명</span>
        <input v-model="form.product" type="text" placeholder="ABS-Black" @input="autofillMaterialFields('product')" />
      </label>
      <label>
        <span>추가 재고</span>
        <input v-model="form.incomingStock" type="text" />
      </label>
      <label>
        <span>주문 금액</span>
        <input v-model="form.orderCost" type="text" />
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
  grid-template-columns: 70px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.modal-form span {
  color: #344054;
  font-size: 13px;
  font-weight: 700;
}

.modal-form input {
  height: 34px;
  border: 1px solid #dce5f0;
  border-radius: 6px;
  background: #ffffff;
  padding: 0 10px;
  color: #344054;
  font-size: 13px;
  font-weight: 600;
  outline: none;
}

.modal-actions {
  display: flex;
  justify-content: center;
}

.modal-save {
  min-width: 70px;
  min-height: 34px;
  border-radius: 8px;
}

@media (max-width: 560px) {
  .modal-form label {
    grid-template-columns: 1fr;
  }
}
</style>
