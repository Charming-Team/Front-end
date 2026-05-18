<script setup>
import AppModal from "../common/AppModal.vue";

defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "download-pdf", "open-mail"]);

const exportOptions = [
  {
    value: "PDF",
    title: "PDF 다운로드",
    description: "보고서를 PDF 파일로\n저장합니다.",
    icon: "PDF",
  },
  {
    value: "MAIL",
    title: "메일 발송",
    description: "선택한 사용자에게 보고서를\n공유합니다.",
    icon: "MAIL",
  },
];

function handleClick(value) {
  if (value === "PDF") {
    emit("download-pdf");
    return;
  }

  emit("open-mail");
}
</script>

<template>
  <AppModal title="내보내기" @close="emit('close')">
    <div class="grid gap-6">
      <p class="text-[15px] font-bold leading-6 text-[#173967]">
        보고서를 원하는 방식으로 저장하거나 공유할 수 있습니다.
      </p>

      <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <button
          v-for="option in exportOptions"
          :key="option.value"
          type="button"
          class="group grid min-h-[190px] place-items-center rounded-2xl border border-slate-200 bg-white px-5 py-7 text-center transition hover:border-[#0b5fff] hover:bg-blue-50 hover:shadow-[0_0_0_3px_rgba(37,99,235,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="handleClick(option.value)"
        >
          <div class="grid justify-items-center gap-4">
            <div
              v-if="option.icon === 'PDF'"
              class="relative grid h-14 w-14 place-items-center rounded-xl border-2 border-[#0b3d91] text-[11px] font-black text-[#0b3d91]"
            >
              <span
                class="absolute -bottom-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white"
              >
                PDF
              </span>
              <span class="mb-3 text-2xl">▯</span>
            </div>

            <div
              v-else
              class="grid h-14 w-14 place-items-center rounded-xl text-[#0b3d91]"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-14 w-14"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </div>

            <div>
              <h3 class="text-[18px] font-black text-[#0f2f5f]">
                {{ option.title }}
              </h3>
              <p
                class="mt-2 whitespace-pre-line text-[14px] font-semibold leading-6 text-[#526b8f]"
              >
                {{ option.description }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  </AppModal>
</template>