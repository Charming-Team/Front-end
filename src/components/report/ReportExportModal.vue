<script setup>
import AppModal from "../common/AppModal.vue";
import ReportPdfIcon from "../../assets/icons/pdf_icon.png";
import ReportMailIcon from "../../assets/icons/mail_icon.png";

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
    icon: ReportPdfIcon,
    iconAlt: "PDF 다운로드 아이콘",
  },
  {
    value: "MAIL",
    title: "메일 발송",
    description: "선택한 사용자에게 보고서를\n공유합니다.",
    icon: ReportMailIcon,
    iconAlt: "메일 발송 아이콘",
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
    <div class="grid gap-4">
      <p class="text-[16px] font-bold leading-6 text-[#173967] pl-2">
        보고서를 원하는 방식으로 저장하거나 공유할 수 있습니다.
      </p>

      <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <button
          v-for="option in exportOptions"
          :key="option.value"
          type="button"
          class="export-option-card group grid min-h-[190px] place-items-center border border-slate-200 bg-white px-5 py-7 text-center transition hover:border-[#0b5fff] hover:bg-blue-50 hover:shadow-[0_8px_24px_rgba(37,99,235,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="loading"
          @click="handleClick(option.value)"
        >
          <div class="grid justify-items-center gap-4">
            <div class="grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 transition group-hover:bg-white">
              <img
                :src="option.icon"
                :alt="option.iconAlt"
                class="h-11 w-11 object-contain"
              />
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

<style scoped>
.export-option-card {
  border-radius: 24px;
  overflow: hidden;
  appearance: none;
  -webkit-appearance: none;
}

.export-option-card:hover,
.export-option-card:focus,
.export-option-card:active {
  border-radius: 24px;
}
</style>