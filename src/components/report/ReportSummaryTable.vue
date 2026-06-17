<script setup>
defineProps({
  summaryRows: {
    type: Array,
    default: () => [],
  },
  lineRows: {
    type: Array,
    default: () => [],
  },
  equipmentRows: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div class="grid min-w-0 gap-6">
    <section class="min-w-0">
      <span class="block mb-2 text-[25px] font-bold text-[#0f3a70]">
        주요 요약
      </span>

      <div class="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[560px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col class="w-[42%]" />
            <col class="w-[42%]" />
            <col class="w-[16%]" />
          </colgroup>
          <thead class="bg-slate-50">
            <tr>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">구분</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">단위/수치</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in summaryRows"
              :key="row.label"
              class="border-t border-slate-200"
            >
              <td class="h-8 whitespace-nowrap px-4 font-bold text-[#26456f]">{{ row.label }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.value }}</td>
              <td
                class="h-8 whitespace-nowrap px-4 font-bold"
                :class="row.change?.startsWith('↑') ? 'text-[#0b4ea2]' : row.change?.startsWith('↓') ? 'text-[#0b4ea2]' : 'text-slate-400'"
              >
                {{ row.change || "-" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="min-w-0">
      <span class="block mb-2 text-[25px] font-bold text-[#0f3a70]">
        라인별 성과
      </span>

      <div class="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[760px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col class="w-[30%]" />
            <col class="w-[14%]" />
            <col class="w-[22%]" />
            <col class="w-[14%]" />
            <col class="w-[20%]" />
          </colgroup>
          <thead class="bg-slate-50">
            <tr>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">라인</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">가동률</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">생산 완료 수량</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">불량률</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in lineRows"
              :key="row.line"
              class="border-t border-slate-200"
            >
              <td class="h-8 whitespace-nowrap px-4 font-bold text-[#26456f]">{{ row.line }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.utilization }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.completed }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.defectRate }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-bold text-[#26456f]">{{ row.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="min-w-0">
      <span class="block mb-2 text-[25px] font-bold text-[#0f3a70]">
        주요 설비 현황
      </span>

      <div class="w-full max-w-full overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full min-w-[700px] table-fixed border-collapse text-[13px]">
          <colgroup>
            <col class="w-[42%]" />
            <col class="w-[18%]" />
            <col class="w-[20%]" />
            <col class="w-[20%]" />
          </colgroup>
          <thead class="bg-slate-50">
            <tr>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">설비명</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">가동률</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">다운 타임</th>
              <th class="h-9 whitespace-nowrap px-4 text-left font-black text-[#0f3a70]">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in equipmentRows"
              :key="row.name"
              class="border-t border-slate-200"
            >
              <td class="h-8 whitespace-nowrap px-4 font-bold text-[#26456f]">{{ row.name }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.utilization }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-extrabold text-[#173967]">{{ row.downTime }}</td>
              <td class="h-8 whitespace-nowrap px-4 font-bold text-[#26456f]">
                <span
                  class="mr-1 inline-block h-3 w-3 rounded-full"
                  :class="row.status === '주의' ? 'bg-amber-400' : 'bg-emerald-500'"
                />
                {{ row.status }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
