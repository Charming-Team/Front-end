<script setup>
import AppButton from './AppButton.vue'

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
    <svg viewBox="0 0 24 24" aria-hidden="true" class="size-[22px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.2]">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
    <span
      v-if="count !== '' && count != null"
      class="absolute -right-[7px] -top-2 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-[#e53935] px-[5px] text-[12px] font-extrabold text-white"
    >
      {{ count }}
    </span>
  </AppButton>
</template>
