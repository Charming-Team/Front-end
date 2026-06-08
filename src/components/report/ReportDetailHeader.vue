<script setup>
import AppButton from "../common/AppButton.vue";

defineProps({
  report: {
    type: Object,
    required: true,
  },
  showExecutiveButton: {
    type: Boolean,
    default: true,
  },
  actionsDisabled: {
    type: Boolean,
    default: false,
  },
  executiveButtonLabel: {
    type: String,
    default: "비즈니스 보고서 생성",
  },
});

const emit = defineEmits([
  "back",
  "create-executive",
  "export",
  "edit",
]);
</script>

<template>
  <div class="border-b border-slate-200 bg-white px-6 py-5">
    <button
      type="button"
      class="mb-7 inline-flex items-center gap-2 text-[14px] font-extrabold text-[#0b4ea2] transition hover:text-[#083b7a]"
      @click="emit('back')"
    >
      <span>←</span>
      <span>최근 보고서 목록으로 돌아가기</span>
    </button>

    <div class="flex items-start justify-between gap-6 max-lg:flex-col">
      <div>
        <h1 class="text-[26px] font-black tracking-[-0.02em] text-[#0f2f5f]">
          {{ report.title }}
        </h1>

        <div
          class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] font-bold text-slate-500"
        >
          <span>작성자 : {{ report.author }}</span>
          <span class="h-3 w-px bg-slate-300" />
          <span>작성일 : {{ report.createdAt }}</span>
          <span class="h-3 w-px bg-slate-300" />
          <span>유형 : {{ report.typeLabel }}</span>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <AppButton
          v-if="showExecutiveButton"
          variant="secondary"
          class="min-w-[150px]"
          :disabled="actionsDisabled"
          @click="emit('create-executive')"
        >
          {{ executiveButtonLabel }}
        </AppButton>

        <AppButton
          variant="secondary"
          class="min-w-[110px]"
          :disabled="actionsDisabled"
          @click="emit('export')"
        >
          내보내기
        </AppButton>

        <AppButton
          variant="primary"
          class="min-w-[90px]"
          :disabled="actionsDisabled"
          @click="emit('edit')"
        >
          수정
        </AppButton>

        <button
          type="button"
          class="grid h-11 w-10 place-items-center rounded-xl text-xl font-black text-[#173967] transition hover:bg-slate-100"
        >
          ⋮
        </button>
      </div>
    </div>
  </div>
</template>
