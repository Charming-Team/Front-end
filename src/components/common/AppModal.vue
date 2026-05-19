<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["close"]);
</script>

<template>
  <div
    class="fixed inset-0 z-[1000] grid place-items-center bg-slate-900/15 px-4 py-6"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-[calc(100vh-48px)] w-[600px] max-w-[calc(100vw-32px)] flex-col rounded-[15px] border border-[#e8eef7] bg-white px-[18px] pb-4 pt-[18px] shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
    >
      <div class="mb-2.5 flex shrink-0 items-center justify-between gap-3">
        <h3
          v-if="title"
          class="m-0 text-[17px] font-extrabold text-gray-900"
        >
          {{ title }}
        </h3>

        <slot name="header" />

        <button
          class="grid h-7 w-7 shrink-0 cursor-pointer place-items-center border-0 bg-transparent text-slate-600"
          type="button"
          aria-label="닫기"
          @click="emit('close')"
        >
          <svg
            class="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m5 5 10 10M15 5 5 15"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <slot />
      </div>

      <div
        v-if="$slots.footer"
        class="mt-[18px] shrink-0"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>