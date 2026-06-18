<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppButton from "../../components/common/AppButton.vue";
import AppCard from "../../components/common/AppCard.vue";
import AppLoadingOverlay from "../../components/common/AppLoadingOverlay.vue";
import AppToast from "../../components/common/AppToast.vue";
import ReportAnalysisContent from "../../components/report/ReportAnalysisContent.vue";
import ReportDetailHeader from "../../components/report/ReportDetailHeader.vue";
import ReportEditModal from "../../components/report/ReportEditModal.vue";
import ReportExportModal from "../../components/report/ReportExportModal.vue";
import ReportMailSendModal from "../../components/report/ReportMailSendModal.vue";
import ReportSummaryTable from "../../components/report/ReportSummaryTable.vue";
import {
  createBusinessReport,
  downloadReportPdf,
  fetchReportDetail,
  sendReportPdfMail,
  updateReport,
  waitForReportJobSuccess,
} from "../../features/report/api.js";
import { mapReportDetailForView } from "../../features/report/mapper.js";

const router = useRouter();
const route = useRoute();

const report = ref(null);
const detailLoading = ref(false);
const detailError = ref("");

const isExportModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isMailModalOpen = ref(false);
const isProcessing = ref(false);

const activeReportPane = ref("balanced");

function setActiveReportPane(pane) {
  activeReportPane.value = activeReportPane.value === pane ? "balanced" : pane;
}

const toast = ref({
  show: false,
  title: "",
  message: "",
  type: "success",
});

const mailRecipients = ref([
  {
    id: 1,
    name: "생산관리팀",
    email: "abc@sk.com",
  },
  {
    id: 2,
    name: "경영지원팀",
    email: "sajangnim@sk.com",
  },
  {
    id: 3,
    name: "대표이사",
    email: "boss@sk.com",
  },
  {
    id: 4,
    name: "운영관리팀",
    email: "iluvskax@sk.com",
  },
]);

const selectedRecipientIds = ref([1, 2]);
const mailSubject = ref("");
const mailBody = ref("");

const isExecutiveReport = computed(() => {
  return report.value?.reportMode === "EXECUTIVE";
});

const loadingTitle = ref("처리 중입니다");
const loadingDescription = ref("잠시만 기다려 주세요.");

function showToast(title, message = "", type = "success") {
  toast.value = {
    show: true,
    title,
    message,
    type,
  };

  setTimeout(() => {
    toast.value.show = false;
  }, 2200);
}

function goBack() {
  router.push("/reports");
}

async function handleCreateExecutiveReport() {
  if (!report.value?.id) return;

  isProcessing.value = true;
  loadingTitle.value = "비즈니스 보고서를 생성하고 있습니다";
  loadingDescription.value =
    "현재 보고서를 기준으로 새 경영진용 보고서 생성 Job을 실행하고 있습니다.";

  try {
    const jobStart = await createBusinessReport(report.value.id);
    const completedJob = await waitForReportJobSuccess(jobStart.reportJobId);

    showToast(
      "비즈니스 보고서가 생성되었습니다",
      "생성된 경영진용 보고서로 이동합니다."
    );

    router.push(`/reports/${completedJob.resultReportId}`);
  } catch (error) {
    showToast(
      "비즈니스 보고서 생성에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isProcessing.value = false;
  }
}

function openExportModal() {
  isExportModalOpen.value = true;
}

function closeExportModal() {
  if (isProcessing.value) return;
  isExportModalOpen.value = false;
}

function sanitizePdfFileName(value) {
  const fallback = `report-${report.value?.id ?? "download"}.pdf`;
  if (!value) return fallback;

  const sanitized = value
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) return fallback;
  return sanitized.toLowerCase().endsWith(".pdf") ? sanitized : `${sanitized}.pdf`;
}

function saveBlobAsFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

function openMailModal() {
  isExportModalOpen.value = false;

  mailSubject.value = `[S-MAP] ${report.value.title} 공유드립니다.`;
  mailBody.value = `안녕하세요.

${report.value.title}를 공유드립니다.

주요 내용은 다음과 같습니다.

1. 생산 계획 대비 실적과 납기 준수율을 확인했습니다.
2. 라인 가동률, 설비 다운타임, 품질 지표를 기준으로 주요 리스크를 정리했습니다.
3. 개선이 필요한 항목과 후속 조치 의견을 보고서에 포함했습니다.

아래 보고서 링크를 통해 상세 내용을 확인해 주세요.

감사합니다.`;

  isMailModalOpen.value = true;
}

function handleAddMailRecipient(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingRecipient = mailRecipients.value.find(
    (recipient) => recipient.email.toLowerCase() === normalizedEmail
  );

  if (existingRecipient) {
    if (!selectedRecipientIds.value.includes(existingRecipient.id)) {
      selectedRecipientIds.value = [...selectedRecipientIds.value, existingRecipient.id];
    }
    return;
  }

  const recipient = {
    id: `custom-${normalizedEmail}`,
    name: "직접 입력",
    email: normalizedEmail,
  };

  mailRecipients.value = [...mailRecipients.value, recipient];
  selectedRecipientIds.value = [...selectedRecipientIds.value, recipient.id];
}

function closeMailModal() {
  if (isProcessing.value) return;
  isMailModalOpen.value = false;
}

function handleEdit() {
  isEditModalOpen.value = true;
}

function closeEditModal() {
  if (isProcessing.value) return;
  isEditModalOpen.value = false;
}

async function handleSaveReport(payload) {
  if (!report.value?.id) return;

  isProcessing.value = true;
  loadingTitle.value = "보고서를 저장하고 있습니다";
  loadingDescription.value = "수정한 보고서 내용을 저장하는 중입니다.";

  try {
    const response = await updateReport(report.value.id, payload);
    report.value = mapReportDetailForView(response);
    isEditModalOpen.value = false;
    showToast("보고서가 수정되었습니다");
  } catch (error) {
    showToast(
      "보고서 수정에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isProcessing.value = false;
  }
}

async function handleDownloadPdf() {
  if (!report.value?.id) return;

  isExportModalOpen.value = false;
  isProcessing.value = true;
  loadingTitle.value = "PDF를 생성하고 있습니다";
  loadingDescription.value = "보고서를 PDF 파일로 변환하는 중입니다.";

  try {
    const response = await downloadReportPdf(report.value.id);
    const filename = sanitizePdfFileName(response.filename || report.value.title);
    saveBlobAsFile(response.blob, filename);

    showToast(
      "PDF 다운로드가 완료되었습니다",
      `${filename} 파일이 생성되었습니다.`
    );
  } catch (error) {
    showToast(
      "PDF 다운로드에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isProcessing.value = false;
  }
}

async function handleSendMail() {
  if (!report.value?.id) return;

  isMailModalOpen.value = false;
  isProcessing.value = true;
  loadingTitle.value = "메일을 발송하고 있습니다";
  loadingDescription.value = "보고서 PDF를 생성해 선택한 수신자에게 발송하는 중입니다.";

  try {
    const selectedEmails = mailRecipients.value
      .filter((recipient) => selectedRecipientIds.value.includes(recipient.id))
      .map((recipient) => recipient.email);

    const response = await sendReportPdfMail(report.value.id, {
      recipients: selectedEmails,
      subject: mailSubject.value,
      message: mailBody.value,
    });

    const sentCount = response.recipients?.length ?? selectedEmails.length;
    const attachmentFileName = response.attachmentFileName;

    showToast(
      "메일 발송이 완료되었습니다",
      attachmentFileName
        ? `${sentCount}명에게 ${attachmentFileName} 파일을 발송했습니다.`
        : `${sentCount}명에게 보고서 PDF를 발송했습니다.`
    );
  } catch (error) {
    showToast(
      "메일 발송에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isProcessing.value = false;
  }
}

async function loadReportDetail() {
  detailLoading.value = true;
  detailError.value = "";

  try {
    const response = await fetchReportDetail(route.params.id);
    report.value = mapReportDetailForView(response);
  } catch (error) {
    report.value = null;
    detailError.value = error.message || "보고서 상세 정보를 불러오지 못했습니다.";
  } finally {
    detailLoading.value = false;
  }
}

onMounted(loadReportDetail);

watch(
  () => route.params.id,
  () => {
    loadReportDetail();
  }
);
</script>

<template>
  <AppCard v-if="detailLoading">
    <div class="flex min-h-[420px] items-center justify-center text-[15px] font-bold text-slate-500">
      보고서를 불러오는 중입니다...
    </div>
  </AppCard>

  <AppCard v-else-if="detailError">
    <div class="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center">
      <p class="text-[15px] font-bold text-red-500">{{ detailError }}</p>
      <AppButton variant="secondary" @click="goBack">목록으로 돌아가기</AppButton>
    </div>
  </AppCard>

  <AppCard v-else-if="report">
    <div class="overflow-hidden rounded-2xl bg-white">
      <ReportDetailHeader
        :report="report"
        :show-executive-button="!isExecutiveReport"
        :actions-disabled="isProcessing"
        :executive-button-label="isProcessing ? '생성 중...' : '비즈니스 보고서 생성'"
        @back="goBack"
        @create-executive="handleCreateExecutiveReport"
        @export="openExportModal"
        @edit="handleEdit"
      />

      <div
        class="report-detail-expand-layout p-6 max-xl:grid-cols-1"
        :class="{
          'report-detail-expand-layout-summary': activeReportPane === 'summary',
          'report-detail-expand-layout-analysis': activeReportPane === 'analysis',
        }"
      >
        <div
          class="report-detail-expand-pane report-detail-expand-pane-summary min-w-0 overflow-hidden border-r border-slate-200 pr-6 max-xl:border-r-0 max-xl:border-b max-xl:pb-6 max-xl:pr-0"
          role="button"
          tabindex="0"
          @click="setActiveReportPane('summary')"
          @keydown.enter.prevent="setActiveReportPane('summary')"
        >
          <ReportSummaryTable
            :summary-rows="report.summaryRows"
            :line-rows="report.lineRows"
            :equipment-rows="report.equipmentRows"
          />
        </div>

        <div
          class="report-detail-expand-pane report-detail-expand-pane-analysis min-w-0 pl-7 max-xl:pl-0 max-xl:pt-6"
          role="button"
          tabindex="0"
          @click="setActiveReportPane('analysis')"
          @keydown.enter.prevent="setActiveReportPane('analysis')"
        >
          <ReportAnalysisContent :analysis="report.analysis" />
        </div>
      </div>
    </div>

    <ReportExportModal
      v-if="isExportModalOpen"
      :loading="isProcessing"
      @close="closeExportModal"
      @download-pdf="handleDownloadPdf"
      @open-mail="openMailModal"
    />

    <ReportEditModal
      v-if="isEditModalOpen"
      :report="report"
      :loading="isProcessing"
      @close="closeEditModal"
      @save="handleSaveReport"
    />

    <ReportMailSendModal
      v-if="isMailModalOpen"
      :recipients="mailRecipients"
      :selected-recipient-ids="selectedRecipientIds"
      :subject="mailSubject"
      :body="mailBody"
      :loading="isProcessing"
      @update:selected-recipient-ids="selectedRecipientIds = $event"
      @update:subject="mailSubject = $event"
      @update:body="mailBody = $event"
      @add-recipient="handleAddMailRecipient"
      @close="closeMailModal"
      @send="handleSendMail"
    />

    <AppLoadingOverlay
      :show="isProcessing"
      :title="loadingTitle"
      :description="loadingDescription"
    />

    <AppToast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
    />
  </AppCard>
</template>
<style scoped>
.report-detail-expand-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0;
  align-items: start;
  transition: grid-template-columns 0.36s ease;
}

.report-detail-expand-layout-summary {
  grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
}

.report-detail-expand-layout-analysis {
  grid-template-columns: minmax(260px, 0.65fr) minmax(0, 1.35fr);
}

.report-detail-expand-pane {
  min-width: 0;
  cursor: pointer;
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
}

.report-detail-expand-layout-summary .report-detail-expand-pane-analysis,
.report-detail-expand-layout-analysis .report-detail-expand-pane-summary {
  opacity: 0.72;
  transform: scale(0.985);
}

.report-detail-expand-layout-summary .report-detail-expand-pane-summary,
.report-detail-expand-layout-analysis .report-detail-expand-pane-analysis {
  opacity: 1;
  transform: scale(1);
}

.report-detail-expand-pane:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 6px;
  border-radius: 16px;
}

@media (max-width: 1280px) {
  .report-detail-expand-layout,
  .report-detail-expand-layout-summary,
  .report-detail-expand-layout-analysis {
    grid-template-columns: 1fr;
  }

  .report-detail-expand-pane {
    opacity: 1;
    transform: none;
  }
}
</style>