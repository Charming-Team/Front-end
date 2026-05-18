<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../../components/common/AppCard.vue";
import AppLoadingOverlay from "../../components/common/AppLoadingOverlay.vue";
import AppToast from "../../components/common/AppToast.vue";
import ReportAnalysisContent from "../../components/report/ReportAnalysisContent.vue";
import ReportDetailHeader from "../../components/report/ReportDetailHeader.vue";
import ReportExportModal from "../../components/report/ReportExportModal.vue";
import ReportMailSendModal from "../../components/report/ReportMailSendModal.vue";
import ReportSummaryTable from "../../components/report/ReportSummaryTable.vue";
import { fetchReportDetail } from "../../features/report/api.js";

const router = useRouter();

const report = ref(null);

const isExportModalOpen = ref(false);
const isMailModalOpen = ref(false);
const isProcessing = ref(false);

const toast = ref({
  show: false,
  title: "",
  message: "",
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

function showToast(title, message = "") {
  toast.value = {
    show: true,
    title,
    message,
  };

  setTimeout(() => {
    toast.value.show = false;
  }, 2200);
}

function goBack() {
  router.push("/reports");
}

async function handleCreateExecutiveReport() {
  isProcessing.value = true;
  loadingTitle.value = "비즈니스 보고서를 생성하고 있습니다";
  loadingDescription.value =
    "생산 현황과 리스크 내용을 경영진이 이해하기 쉬운 표현으로 변환하는 중입니다.";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1400));

    report.value = {
      ...report.value,
      reportMode: "EXECUTIVE",
      title: "2024년 05월 경영진용 생산 현황 보고서",
      typeLabel: "경영 요약",
      analysis: {
        overview:
          "2024년 5월 생산 운영은 전반적으로 안정적이었으나, 일부 라인의 가동률 저하와 설비 다운타임 증가로 인해 생산 효율 개선이 필요한 상태입니다.",
        sections: [
          {
            title: "핵심 경영 요약",
            items: [
              "생산 계획 대비 실적은 96.0%로 목표 대비 일부 부족했습니다.",
              "라인 B와 설비 04의 운영 효율 저하가 전체 생산성에 영향을 주었습니다.",
            ],
          },
          {
            title: "사업 영향",
            items: [
              "납기 준수율은 98.1%로 안정적인 수준을 유지하고 있으나, 특정 라인의 병목이 반복될 경우 납기 위험이 증가할 수 있습니다.",
              "불량률이 소폭 증가하여 품질 관리 비용과 재작업 부담이 커질 가능성이 있습니다.",
            ],
          },
          {
            title: "의사결정 필요 사항",
            items: [
              "라인 B 부하 분산과 설비 04 예방 정비 강화 여부를 우선 검토해야 합니다.",
              "품질 관리 기준을 재점검하고 불량률 상승 원인에 대한 후속 분석이 필요합니다.",
            ],
          },
        ],
        recommendation:
          "단기적으로는 병목 라인의 생산 부하를 분산하고, 중기적으로는 설비 예방 정비 체계를 강화하는 방향의 의사결정이 필요합니다.",
      },
    };

    showToast(
      "비즈니스 보고서가 생성되었습니다",
      "경영진이 이해하기 쉬운 보고서 형식으로 변환되었습니다."
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

function closeMailModal() {
  if (isProcessing.value) return;
  isMailModalOpen.value = false;
}

function handleEdit() {
  console.log("보고서 수정");
}

async function handleDownloadPdf() {
  isExportModalOpen.value = false;
  isProcessing.value = true;
  loadingTitle.value = "PDF를 생성하고 있습니다";
  loadingDescription.value = "보고서를 PDF 파일로 변환하는 중입니다.";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    showToast(
      "PDF 다운로드가 완료되었습니다",
      "보고서 PDF 파일이 생성되었습니다."
    );
  } finally {
    isProcessing.value = false;
  }
}

async function handleSendMail() {
  isMailModalOpen.value = false;
  isProcessing.value = true;
  loadingTitle.value = "메일을 발송하고 있습니다";
  loadingDescription.value = "선택한 수신자에게 보고서 메일을 발송하는 중입니다.";

  try {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const selectedEmails = mailRecipients.value
      .filter((recipient) => selectedRecipientIds.value.includes(recipient.id))
      .map((recipient) => recipient.email);

    console.log("메일 발송 대상:", selectedEmails);
    console.log("메일 제목:", mailSubject.value);
    console.log("메일 내용:", mailBody.value);

    showToast(
      "메일 발송이 완료되었습니다",
      `${selectedEmails.length}명에게 보고서 메일을 발송했습니다.`
    );
  } finally {
    isProcessing.value = false;
  }
}

onMounted(async () => {
  report.value = await fetchReportDetail();

  report.value = {
    ...report.value,
    reportMode: "NORMAL",
  };
});
</script>

<template>
  <AppCard v-if="report">
    <div class="overflow-hidden rounded-2xl bg-white">
      <ReportDetailHeader
        :report="report"
        :show-executive-button="!isExecutiveReport"
        @back="goBack"
        @create-executive="handleCreateExecutiveReport"
        @export="openExportModal"
        @edit="handleEdit"
      />

      <div class="grid grid-cols-[0.78fr_1.22fr] gap-0 p-6 max-xl:grid-cols-1">
        <div
          class="border-r border-slate-200 pr-6 max-xl:border-r-0 max-xl:border-b max-xl:pb-6 max-xl:pr-0"
        >
          <ReportSummaryTable
            :summary-rows="report.summaryRows"
            :line-rows="report.lineRows"
            :equipment-rows="report.equipmentRows"
          />
        </div>

        <div class="pl-7 max-xl:pl-0 max-xl:pt-6">
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
    />
  </AppCard>
</template>