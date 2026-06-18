<script setup>
import { computed } from "vue";

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

const pages = computed(() => {
  const total = Number(props.totalPages) || 1;
  const current = Number(props.currentPage) || 1;
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  let start = current - Math.floor(maxVisible / 2);
  let end = current + Math.floor(maxVisible / 2);

  if (start < 1) {
    start = 1;
    end = maxVisible;
  }

  if (end > total) {
    end = total;
    start = total - maxVisible + 1;
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});

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
      v-if="currentPage > 1"
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-first')"
    >
      «
    </button>

    <button
      v-if="currentPage > 1"
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-prev')"
    >
      ‹
    </button>

    <button
      v-for="page in pages"
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

    <button
      v-if="currentPage < totalPages"
      type="button"
      class="grid h-7 min-w-7 place-items-center rounded-full bg-transparent text-[14px] font-extrabold text-[#173967] transition hover:bg-blue-50"
      @click="emit('go-next')"
    >
      ›
    </button>

    <button
      v-if="currentPage < totalPages"
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