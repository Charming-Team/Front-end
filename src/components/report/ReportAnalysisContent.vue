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
    <h2 class="mb-6 text-[18px] font-black text-[#0f3a70]">
      보고서 요약 및 분석
    </h2>

    <div class="grid gap-7 text-[15px] font-semibold leading-8 text-[#31527c]">
      <p>
        {{ analysis.overview }}
      </p>

      <div
        v-for="section in analysis.sections"
        :key="section.title"
      >
        <h3 class="mb-2 text-[16px] font-black text-[#0f3a70]">
          {{ section.title }}
        </h3>

        <ul class="list-disc space-y-1 pl-5">
          <li
            v-for="item in section.items"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <div>
        <h3 class="mb-2 text-[16px] font-black text-[#0f3a70]">
          종합 의견 및 제안
        </h3>
        <p>
          {{ analysis.recommendation }}
        </p>
      </div>
    </div>
  </section>
</template>