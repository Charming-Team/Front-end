<script setup>
import { computed, reactive, watch } from "vue";
import AppButton from "../common/AppButton.vue";
import AppModal from "../common/AppModal.vue";

const props = defineProps({
  report: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "save"]);

const form = reactive({
  title: "",
  overview: "",
  recommendation: "",
  sections: [],
});

function resetForm() {
  const analysis = props.report?.analysis ?? {};
  form.title = props.report?.title ?? "";
  form.overview = analysis.overview ?? "";
  form.recommendation = analysis.recommendation ?? "";
  form.sections = Array.isArray(analysis.sections)
    ? analysis.sections.map((section) => ({
      title: section.title ?? "",
      itemsText: Array.isArray(section.items) ? section.items.join("\n") : "",
    }))
    : [];
}

function parseItems(itemsText) {
  return String(itemsText ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildAnalysis() {
  const sections = form.sections
    .map((section) => ({
      title: section.title.trim(),
      items: parseItems(section.itemsText),
    }))
    .filter((section) => section.title || section.items.length > 0);

  return {
    overview: form.overview.trim(),
    sections,
    recommendation: form.recommendation.trim(),
  };
}

function buildMarkdown(analysis) {
  const lines = [`# ${form.title.trim()}`, ""];

  if (analysis.overview) {
    lines.push(analysis.overview, "");
  }

  analysis.sections.forEach((section) => {
    if (section.title) {
      lines.push(`## ${section.title}`, "");
    }

    section.items.forEach((item) => {
      lines.push(`- ${item}`);
    });

    lines.push("");
  });

  if (analysis.recommendation) {
    lines.push("## 종합 의견 및 제안", "", analysis.recommendation, "");
  }

  return lines.join("\n").trim();
}

const validationMessage = computed(() => {
  if (!form.title.trim()) {
    return "보고서 제목을 입력해 주세요.";
  }

  if (form.title.trim().length > 200) {
    return "보고서 제목은 200자 이하여야 합니다.";
  }

  return "";
});

const canSave = computed(() => !validationMessage.value && !props.loading);

function addSection() {
  form.sections.push({
    title: "",
    itemsText: "",
  });
}

function removeSection(index) {
  form.sections.splice(index, 1);
}

function handleSave() {
  if (!canSave.value) return;

  const analysis = buildAnalysis();
  emit("save", {
    title: form.title.trim(),
    markdown: buildMarkdown(analysis),
    summaryRows: props.report.summaryRows ?? [],
    lineRows: props.report.lineRows ?? [],
    equipmentRows: props.report.equipmentRows ?? [],
    analysis,
  });
}

watch(
  () => props.report,
  resetForm,
  { immediate: true }
);
</script>

<template>
  <AppModal title="보고서 수정" @close="emit('close')">
    <div class="grid gap-5 pb-2">
      <label class="grid gap-2">
        <span class="text-[14px] font-extrabold text-[#16345f]">
          보고서 제목
        </span>
        <input
          v-model="form.title"
          type="text"
          class="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
          :disabled="loading"
        />
      </label>

      <label class="grid gap-2">
        <span class="text-[14px] font-extrabold text-[#16345f]">
          보고서 요약
        </span>
        <textarea
          v-model="form.overview"
          rows="4"
          class="min-h-[120px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
          :disabled="loading"
        />
      </label>

      <section class="grid gap-3">
        <div class="flex items-center justify-between gap-3">
          <h4 class="text-[14px] font-extrabold text-[#16345f]">
            분석 섹션
          </h4>

          <AppButton
            variant="secondary"
            size="sm"
            :disabled="loading"
            @click="addSection"
          >
            섹션 추가
          </AppButton>
        </div>

        <div
          v-for="(section, index) in form.sections"
          :key="index"
          class="grid gap-3 rounded-xl border border-slate-200 p-4"
        >
          <div class="flex items-center gap-3">
            <input
              v-model="section.title"
              type="text"
              placeholder="섹션 제목"
              class="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
              :disabled="loading"
            />

            <AppButton
              variant="secondary"
              size="sm"
              :disabled="loading"
              @click="removeSection(index)"
            >
              삭제
            </AppButton>
          </div>

          <textarea
            v-model="section.itemsText"
            rows="4"
            placeholder="분석 항목을 줄바꿈으로 입력하세요."
            class="min-h-[110px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
            :disabled="loading"
          />
        </div>

        <p
          v-if="form.sections.length === 0"
          class="rounded-xl bg-slate-50 px-4 py-3 text-[13px] font-bold text-slate-500"
        >
          분석 섹션이 없습니다. 필요한 경우 섹션을 추가해 주세요.
        </p>
      </section>

      <label class="grid gap-2">
        <span class="text-[14px] font-extrabold text-[#16345f]">
          종합 의견 및 제안
        </span>
        <textarea
          v-model="form.recommendation"
          rows="4"
          class="min-h-[120px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-semibold leading-6 text-[#173967] outline-none transition focus:border-[#0b4ea2] focus:ring-4 focus:ring-blue-100"
          :disabled="loading"
        />
      </label>

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
          :disabled="!canSave"
          @click="handleSave"
        >
          {{ loading ? "저장 중..." : "저장" }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>
