<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppButton from "../../components/common/AppButton.vue";
import AppCard from "../../components/common/AppCard.vue";
import AppLoadingOverlay from "../../components/common/AppLoadingOverlay.vue";
import AppSearchField from "../../components/common/AppSearchField.vue";
import AppToast from "../../components/common/AppToast.vue";
import ReportCreateModal from "../../components/report/ReportCreateModal.vue";
import ReportIssueTable from "../../components/report/ReportIssueTable.vue";
import ReportListTable from "../../components/report/ReportListTable.vue";
import ReportPagination from "../../components/report/ReportPagination.vue";
import {
  createReport,
  fetchRecentIssues,
  fetchReports,
  waitForReportJobSuccess,
} from "../../features/report/api.js";
import { REPORT_TYPES } from "../../features/report/constants.js";
import {
  mapIssueForView,
  mapReportForView,
} from "../../features/report/mapper.js";

const router = useRouter();

function formatDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDefaultReportPeriod() {
  const today = new Date();
  const firstDayOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    startDate: formatDateInputValue(firstDayOfCurrentMonth),
    endDate: formatDateInputValue(today),
  };
}

const searchQuery = ref("");
const reports = ref([]);
const issues = ref([]);
const currentPage = ref(1);
const pageSize = 10;

const isCreateModalOpen = ref(false);
const isCreating = ref(false);
const creatingReportType = ref("");
const toast = ref({
  show: false,
  title: "",
  message: "",
  type: "success",
});

const defaultReportPeriod = getDefaultReportPeriod();
const startDate = ref(defaultReportPeriod.startDate);
const endDate = ref(defaultReportPeriod.endDate);

const filteredReports = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();

  if (!keyword) return reports.value;

  return reports.value.filter((report) => {
    return [report.title, report.typeLabel, report.author].some((value) =>
      String(value).toLowerCase().includes(keyword)
    );
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredReports.value.length / pageSize))
);

const visiblePages = computed(() => {
  const maxVisible = 3;
  const pages = [];

  for (let page = 1; page <= Math.min(maxVisible, totalPages.value); page += 1) {
    pages.push(page);
  }

  return pages;
});

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredReports.value.slice(start, start + pageSize);
});

function openCreateModal() {
  isCreateModalOpen.value = true;
}

function closeCreateModal() {
  if (isCreating.value) return;
  isCreateModalOpen.value = false;
}

function handleSearch() {
  currentPage.value = 1;
}

function selectReport(report) {
  router.push(`/reports/${report.id}`);
}

function showToast(title, message = "", type = "success") {
  toast.value = {
    show: true,
    title,
    message,
    type,
  };

  setTimeout(() => {
    toast.value.show = false;
  }, 2600);
}

async function handleCreateReport() {
  isCreateModalOpen.value = false;
  isCreating.value = true;
  creatingReportType.value = REPORT_TYPES.ON_DEMAND;

  try {
    const jobStart = await createReport({
      reportType: REPORT_TYPES.ON_DEMAND,
      startDate: startDate.value,
      endDate: endDate.value,
    });
    const completedJob = await waitForReportJobSuccess(jobStart.reportJobId);

    await loadReportPageData();
    router.push(`/reports/${completedJob.resultReportId}`);
  } catch (error) {
    showToast(
      "보고서 생성에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isCreating.value = false;
    creatingReportType.value = "";
  }
}

async function handleCreateMonthlyReport() {
  const period = getDefaultReportPeriod();
  isCreating.value = true;
  creatingReportType.value = REPORT_TYPES.MONTHLY;

  try {
    const jobStart = await createReport({
      reportType: REPORT_TYPES.MONTHLY,
      startDate: period.startDate,
      endDate: period.endDate,
    });
    const completedJob = await waitForReportJobSuccess(jobStart.reportJobId);

    await loadReportPageData();
    router.push(`/reports/${completedJob.resultReportId}`);
  } catch (error) {
    showToast(
      "월간 보고서 생성에 실패했습니다",
      error.message || "잠시 후 다시 시도해 주세요.",
      "error"
    );
  } finally {
    isCreating.value = false;
    creatingReportType.value = "";
  }
}

function goToFirstPage() {
  currentPage.value = 1;
}

function goToPrevPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function goToPage(page) {
  currentPage.value = Number(page);
}

function goToNextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1);
}

function goToLastPage() {
  currentPage.value = totalPages.value;
}

async function loadReportPageData() {
  const [reportResponse, issueResponse] = await Promise.all([
    fetchReports(),
    fetchRecentIssues(),
  ]);

  reports.value = reportResponse.map(mapReportForView);
  issues.value = issueResponse.map(mapIssueForView);
}

watch(searchQuery, () => {
  currentPage.value = 1;
});

watch(totalPages, (nextTotalPages) => {
  if (currentPage.value > nextTotalPages) {
    currentPage.value = nextTotalPages;
  }
});

onMounted(() => {
  loadReportPageData();
});
</script>

<template>
  <div class="grid gap-[14px]">
    <div class="grid grid-cols-[minmax(0,1fr)_180px_180px] items-center gap-[14px] max-md:grid-cols-1">
      <AppSearchField
        v-model="searchQuery"
        placeholder="보고서 유형, 제목, 작성자 (리스트에서 볼 수 있는 값만 검색 가능)"
        button-label="검색"
        @search="handleSearch"
      />

      <AppButton
        variant="primary"
        class="h-11 text-[15px] font-extrabold max-md:w-full"
        :disabled="isCreating"
        @click="openCreateModal"
      >
        {{
          creatingReportType === REPORT_TYPES.ON_DEMAND
            ? "생성 중..."
            : "기간 보고서 생성"
        }}
      </AppButton>

      <AppButton
        variant="secondary"
        class="h-11 text-[15px] font-extrabold max-md:w-full"
        :disabled="isCreating"
        @click="handleCreateMonthlyReport"
      >
        {{
          creatingReportType === REPORT_TYPES.MONTHLY
            ? "생성 중..."
            : "월간 보고서 생성"
        }}
      </AppButton>
    </div>

    <AppCard>
      <section class="px-4 pb-5 pt-[18px]">
        <span class="mb-4 block text-[17px] font-[800] tracking-[-0.2px] text-[#111827]">
          최근 보고서 목록
        </span>

        <ReportListTable
          :reports="paginatedReports"
          @select="selectReport"
        />

        <ReportPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :visible-pages="visiblePages"
          @go-first="goToFirstPage"
          @go-prev="goToPrevPage"
          @go-page="goToPage"
          @go-next="goToNextPage"
          @go-last="goToLastPage"
        />
      </section>
    </AppCard>

    <AppCard>
      <section class="px-4 pb-[18px] pt-[18px] max-md:p-4">
        <span class="mb-4 block text-[17px] font-[800] tracking-[-0.2px] text-[#111827]">
          최근 과거 이슈 내역
        </span>

        <ReportIssueTable :issues="issues" />
      </section>
    </AppCard>

    <ReportCreateModal
      v-if="isCreateModalOpen"
      :start-date="startDate"
      :end-date="endDate"
      :loading="isCreating"
      @update:start-date="startDate = $event"
      @update:end-date="endDate = $event"
      @close="closeCreateModal"
      @create="handleCreateReport"
    />

    <AppLoadingOverlay
      :show="isCreating"
      title="보고서를 생성하고 있습니다"
      description="보고서 생성 Job을 실행하고 있습니다. 완료되면 새 보고서 상세로 이동합니다."
    />

    <AppToast
      :show="toast.show"
      :title="toast.title"
      :message="toast.message"
      :type="toast.type"
    />
  </div>
</template>
