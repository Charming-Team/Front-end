<script setup>
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";
import AppSelect from "../common/AppSelect.vue";
import { MONTH_OPTIONS } from "../../features/report/constants.js";

defineProps({
  selectedMonth: {
    type: String,
    default: "2024-05",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "close",
  "update:selectedMonth",
  "create",
]);
</script>

<template>
  <AppModal title="보고서 생성하기" @close="emit('close')">
    <div class="grid gap-3 pb-2">
      <label class="text-[14px] font-extrabold text-[#16345f]">
        월 선택
      </label>

      <AppSelect
        :model-value="selectedMonth"
        :options="MONTH_OPTIONS"
        class="w-full"
        @update:model-value="emit('update:selectedMonth', $event)"
      />

      <p class="mt-0.5 text-[14px] font-semibold text-slate-500">
        선택한 월의 데이터를 기준으로 보고서가 생성됩니다.
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButton
          variant="secondary"
          class="min-w-[120px]"
          :disabled="loading"
          @click="emit('close')"
        >
          취소
        </AppButton>

        <AppButton
          variant="primary"
          class="min-w-[120px]"
          :disabled="loading"
          @click="emit('create')"
        >
          {{ loading ? "생성 중..." : "생성" }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>