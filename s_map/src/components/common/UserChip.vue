<script setup>
defineProps({
  label: { type: String, required: true },
})
</script>

<template>
  <div class="flex items-center gap-3 text-[15px] font-semibold text-[var(--color-navy)] sm:text-[17px]">
    <span class="grid size-11 place-items-center rounded-full bg-blue-50 text-[var(--color-navy)] sm:size-12" aria-hidden="true">
      <svg viewBox="0 0 24 24" class="size-6 fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] sm:size-[27px]">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
    <span>{{ label }}</span>
    <span class="inline-block size-2 -translate-y-0.5 rotate-45 border-b-2 border-r-2 border-current" aria-hidden="true"></span>
  </div>
</template>
