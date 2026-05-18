<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../../components/common/AppCard.vue";
import ReportAnalysisContent from "../../components/report/ReportAnalysisContent.vue";
import ReportDetailHeader from "../../components/report/ReportDetailHeader.vue";
import ReportSummaryTable from "../../components/report/ReportSummaryTable.vue";
import { fetchReportDetail } from "../../features/report/api.js";

const router = useRouter();
const report = ref(null);

function goBack() {
  router.push("/reports");
}

function handleCreateExecutiveReport() {
  console.log("비즈니스 보고서 생성");
}

function handleExport() {
  console.log("내보내기");
}

function handleEdit() {
  console.log("보고서 수정");
}

onMounted(async () => {
  report.value = await fetchReportDetail();
});
</script>

<template>
  <AppCard v-if="report">
    <div class="overflow-hidden rounded-2xl bg-white">
      <ReportDetailHeader
        :report="report"
        @back="goBack"
        @create-executive="handleCreateExecutiveReport"
        @export="handleExport"
        @edit="handleEdit"
      />

      <div class="grid grid-cols-[0.78fr_1.22fr] gap-0 p-6 max-xl:grid-cols-1">
        <div class="border-r border-slate-200 pr-6 max-xl:border-r-0 max-xl:border-b max-xl:pb-6 max-xl:pr-0">
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
  </AppCard>
</template>