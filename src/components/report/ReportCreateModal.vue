<script setup>
import { computed } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";

const props = defineProps({
  startDate: {
    type: String,
    default: "",
  },
  endDate: {
    type: String,
    default: "",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "close",
  "update:startDate",
  "update:endDate",
  "create",
]);

const validationMessage = computed(() => {
  if (!props.startDate || !props.endDate) {
    return "보고서를 생성할 시작일과 종료일을 선택해 주세요.";
  }

  const start = new Date(props.startDate);
  const end = new Date(props.endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "올바른 날짜를 선택해 주세요.";
  }

  if (start > end) {
    return "종료일은 시작일보다 빠를 수 없습니다.";
  }

  const limit = new Date(start);
  limit.setMonth(limit.getMonth() + 2);

  if (end > limit) {
    return "보고서 생성 기간은 최대 2개월까지만 선택할 수 있습니다.";
  }

  return "";
});

const canCreate = computed(() => !validationMessage.value && !props.loading);
</script>

<template>
  <AppModal title="보고서 생성하기" @close="emit('close')">
    <div class="grid gap-5 pb-2">
      <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <label class="grid gap-2">
          <span class="text-[14px] font-extrabold text-[#16345f]">
            시작일
          </span>
          <input
            type="date"
            :value="startDate"
            class="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
            @input="emit('update:startDate', $event.target.value)"
          />
        </label>

        <label class="grid gap-2">
          <span class="text-[14px] font-extrabold text-[#16345f]">
            종료일
          </span>
          <input
            type="date"
            :value="endDate"
            class="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
            @input="emit('update:endDate', $event.target.value)"
          />
        </label>
      </div>

      <div class="rounded-xl bg-blue-50 px-4 py-3">
        <p class="text-[14px] font-semibold leading-6 text-[#31527c]">
          선택한 기간의 주문, 생산계획, 자재, 라인, 리스크 데이터를 기준으로 AI 보고서가 생성됩니다.
          보고서 생성 기간은 최대 2개월까지 선택할 수 있습니다.
        </p>
      </div>

      <p
        v-if="validationMessage"
        class="text-[13px] font-bold text-red-500"
      >
        {{ validationMessage }}
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
          :disabled="!canCreate"
          @click="emit('create')"
        >
          {{ loading ? "생성 중..." : "생성" }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>