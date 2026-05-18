<script setup>
import { computed, onMounted, ref, watch } from "vue";
import AppButton from "../../components/common/AppButton.vue";
import AppCard from "../../components/common/AppCard.vue";
import AppSearchField from "../../components/common/AppSearchField.vue";
import ReportCreateModal from "../../components/report/ReportCreateModal.vue";
import ReportIssueTable from "../../components/report/ReportIssueTable.vue";
import ReportListTable from "../../components/report/ReportListTable.vue";
import ReportPagination from "../../components/report/ReportPagination.vue";
import {
  createReport,
  fetchRecentIssues,
  fetchReports,
} from "../../features/report/api.js";
import { MONTH_OPTIONS } from "../../features/report/constants.js";
import {
  mapIssueForView,
  mapReportForView,
} from "../../features/report/mapper.js";

const searchQuery = ref("");
const reports = ref([]);
const issues = ref([]);
const currentPage = ref(1);
const pageSize = 10;

const isCreateModalOpen = ref(false);
const selectedMonth = ref("2024-05");
const isCreating = ref(false);

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

const selectedMonthLabel = computed(() => {
  return (
    MONTH_OPTIONS.find((option) => option.value === selectedMonth.value)?.label ??
    selectedMonth.value
  );
});

function openCreateModal() {
  isCreateModalOpen.value = true;
}

function closeCreateModal() {
  isCreateModalOpen.value = false;
}

function handleSearch() {
  currentPage.value = 1;
}

function selectReport(report) {
  console.log("보고서 선택:", report);
  // TODO: 상세 페이지 생성 후 router.push(`/reports/${report.id}`)
}

async function handleCreateReport() {
  isCreating.value = true;

  try {
    const createdReport = await createReport({
      month: selectedMonth.value,
      monthLabel: selectedMonthLabel.value,
    });

    console.log("생성된 보고서:", createdReport);

    closeCreateModal();

    // TODO: 백엔드 연동 후 생성된 보고서 상세 페이지로 이동
    // router.push(`/reports/${createdReport.id}`)
  } finally {
    isCreating.value = false;
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
    <div class="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-[14px] max-md:grid-cols-1">
      <AppSearchField
        v-model="searchQuery"
        placeholder="보고서 유형, 제목, 작성자 (리스트에서 볼 수 있는 값만 검색 가능)"
        button-label="검색"
        @search="handleSearch"
      />

      <AppButton
        variant="primary"
        class="h-11 text-[15px] font-extrabold max-md:w-full"
        @click="openCreateModal"
      >
        보고서 생성하기
      </AppButton>
    </div>

    <AppCard>
      <section class="px-5 pb-5 pt-[18px] max-md:p-4">
        <h2 class="mb-4 text-[20px] font-black text-[#0f3a70]">
          최근 보고서 목록
        </h2>

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
      <section class="px-5 pb-[18px] pt-[18px] max-md:p-4">
        <h2 class="mb-4 text-[20px] font-black text-[#0f3a70]">
          최근 과거 이슈 내역
        </h2>

        <ReportIssueTable :issues="issues" />
      </section>
    </AppCard>

    <ReportCreateModal
      v-if="isCreateModalOpen"
      :selected-month="selectedMonth"
      :loading="isCreating"
      @update:selected-month="selectedMonth = $event"
      @close="closeCreateModal"
      @create="handleCreateReport"
    />
  </div>
</template>