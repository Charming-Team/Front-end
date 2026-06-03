<script setup>
import AppStatusBadge from "../common/AppStatusBadge.vue";

defineProps({
  issues: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="w-full overflow-x-auto">
    <table class="w-full min-w-[920px] border-collapse text-[14px] text-[#16345f]">
      <thead class="border-y border-slate-200 bg-slate-50">
        <tr>
          <th class="h-10 whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            날짜
          </th>
          <th class="h-10 whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            이슈 유형
          </th>
          <th class="h-10 whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            내용
          </th>
          <th class="h-10 whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            영향도
          </th>
          <th class="h-10 whitespace-nowrap px-4 text-left font-extrabold text-[#0f3a70]">
            조치 결과
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="issue in issues"
          :key="issue.id"
          class="border-b border-slate-200"
        >
          <td class="h-[42px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ issue.occurredAt }}
          </td>
          <td class="h-[42px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ issue.type }}
          </td>
          <td class="h-[42px] min-w-[320px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ issue.content }}
          </td>
          <td class="h-[42px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            <AppStatusBadge
              :label="issue.impactLabel"
              :tone="issue.impactTone"
            />
          </td>
          <td class="h-[42px] whitespace-nowrap px-4 font-semibold text-[#26456f]">
            {{ issue.result }}
          </td>
        </tr>

        <tr v-if="issues.length === 0">
          <td
            colspan="5"
            class="h-24 px-4 text-center font-bold text-slate-400"
          >
            최근 과거 이슈 내역이 없습니다.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>