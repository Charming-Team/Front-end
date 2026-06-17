<script setup>
const props = defineProps({
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  visiblePages: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "go-first",
  "go-prev",
  "go-page",
  "go-next",
  "go-last",
]);

function isActive(page) {
  return Number(page) === Number(props.currentPage);
}
</script>

<template>
  <nav
    class="flex items-center justify-center gap-2 pt-[18px]"
    aria-label="보고서 페이지네이션"
  >
    <button
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-first')"
    >
      «
    </button>

    <button
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-prev')"
    >
      ‹
    </button>

    <button
      v-for="page in visiblePages"
      :key="page"
      type="button"
      class="pagination-button grid h-7 w-7 place-items-center rounded-full text-[14px] font-extrabold transition"
      :class="
        isActive(page)
          ? 'bg-[#184f96] text-white'
          : 'bg-transparent text-[#173967] hover:bg-blue-50'
      "
      @click="emit('go-page', page)"
    >
      {{ page }}
    </button>

    <span
      v-if="totalPages > 5"
      class="px-1 text-[14px] font-extrabold text-[#173967]"
    >
      ...
    </span>

    <button
      v-if="totalPages > 5"
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full text-[14px] font-extrabold transition"
      :class="
        isActive(totalPages)
          ? 'bg-[#184f96] text-white'
          : 'bg-transparent text-[#173967] hover:bg-blue-50'
      "
      @click="emit('go-page', totalPages)"
    >
      {{ totalPages }}
    </button>

    <button
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-next')"
    >
      ›
    </button>

    <button
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-last')"
    >
      »
    </button>
  </nav>
</template>

<style scoped>
.pagination-button {
  border-radius: 9999px;
  appearance: none;
  border: 0;
}
</style>