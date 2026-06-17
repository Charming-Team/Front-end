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
      class="flex max-h-[calc(100vh-48px)] w-[600px] max-w-[calc(100vw-32px)] flex-col rounded-[15px] border border-[#e8eef7] bg-white px-[18px] pb-4 pt-[20px] shadow-[0_24px_48px_rgba(15,23,42,0.14)]"
    >
      <div class="mb-3 flex shrink-0 items-center justify-between gap-3">
        <span
          v-if="title"
          class="block m-0 pl-2 text-[20px] font-[800] leading-[1.2] tracking-[-0.4px] text-gray-900"
        >
          {{ title }}
        </span>

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