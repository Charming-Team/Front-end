<script setup>
defineProps({
  analysis: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section>
    <span class="block mb-1 text-[25px] font-bold text-[#0f3a70]">
      보고서 요약 및 분석
    </span>

    <div class="grid gap-7 text-[15px] font-semibold leading-8 text-[#31527c]">
      <p v-if="analysis.overview">
        {{ analysis.overview }}
      </p>

      <div
        v-for="section in analysis.sections"
        :key="section.title"
      >
        <span class="block mb-2 text-[20px] font-bold text-[#0f3a70]">
          {{ section.title }}
        </span>

        <ul class="list-disc space-y-1 pl-5">
          <li
            v-for="item in section.items"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="analysis.recommendation">
        <span class="block mb-2 text-[20px] font-bold text-[#0f3a70]">
          종합 의견 및 제안
        </span>
        <p>
          {{ analysis.recommendation }}
        </p>
      </div>
    </div>
  </section>
</template>
