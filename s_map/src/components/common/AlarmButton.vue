<script setup>
defineProps({
  count: { type: [Number, String], default: '' },
  label: { type: String, default: '알림' },
})
</script>

<template>
  <AppButton
    class="relative"
    variant="surface"
    size="icon"
    :icon-only="true"
    :aria-label="label"
  >
    <svg
      class="h-[22px] w-[22px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
    <span
      v-if="count !== '' && count != null"
      class="absolute -top-2 -right-[7px] grid min-w-[22px] h-[22px] place-items-center px-[5px] text-[12px] font-extrabold text-white bg-[#e53935]"
      style="border-radius: 999px;"
    >{{ count }}</span>
  </AppButton>
</template>
