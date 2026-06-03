<script setup>
import AppStatusBadge from "../common/AppStatusBadge.vue";

defineProps({
  reports: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["select"]);
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full min-w-[920px] border-collapse text-[14px] text-[#16345f]">
      <thead class="border-y border-slate-200 bg-slate-50">
        <tr>
          <th class="h-[42px] whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            작성 날짜
          </th>
          <th class="h-[42px] whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            보고서 제목
          </th>
          <th class="h-[42px] whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            보고서 설정 이력
          </th>
          <th class="h-[42px] whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            유형 (월간/수시)
          </th>
          <th class="h-[42px] whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            작성자
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="report in reports"
          :key="report.id"
          class="cursor-pointer border-b border-slate-200 transition-colors duration-150 hover:bg-slate-50"
          @click="emit('select', report)"
        >
          <td class="h-[45px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ report.createdAt }}
          </td>
          <td class="h-[45px] whitespace-nowrap px-4 font-extrabold text-[#153c72]">
            {{ report.title }}
          </td>
          <td class="h-[45px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ report.configuredAt }}
          </td>
          <td class="h-[45px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            <AppStatusBadge
              :label="report.typeLabel"
              :tone="report.typeTone"
            />
          </td>
          <td class="h-[45px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ report.author }}
          </td>
        </tr>

        <tr v-if="reports.length === 0">
          <td
            colspan="5"
            class="h-[120px] px-4 text-center font-bold text-slate-400"
          >
            조회 가능한 보고서가 없습니다.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>