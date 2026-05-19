<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppButton from "../../components/common/AppButton.vue";
import AppCard from "../../components/common/AppCard.vue";
import AppLoadingOverlay from "../../components/common/AppLoadingOverlay.vue";
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
import {
  mapIssueForView,
  mapReportForView,
} from "../../features/report/mapper.js";

const router = useRouter();

const searchQuery = ref("");
const reports = ref([]);
const issues = ref([]);
const currentPage = ref(1);
const pageSize = 10;

const isCreateModalOpen = ref(false);
const isCreating = ref(false);

const startDate = ref("2024-05-01");
const endDate = ref("2024-05-31");

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

async function handleCreateReport() {
  isCreateModalOpen.value = false;
  isCreating.value = true;

  try {
    const createdReport = await createReport({
      startDate: startDate.value,
      endDate: endDate.value,
    });

    router.push(`/reports/${createdReport.id}`);
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
      description="선택한 기간의 생산계획, 자재, 라인, 리스크 데이터를 분석 중입니다."
    />
  </div>
</template>