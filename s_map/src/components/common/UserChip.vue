<script setup>
defineProps({
  label: { type: String, required: true },
})
</script>

<template>
  <div class="flex items-center gap-[10px] text-[15px] font-semibold text-[var(--color-navy)]">
    <span
      class="grid h-10 w-10 place-items-center rounded-full bg-[#eff6ff] text-[var(--color-navy)]"
      aria-hidden="true"
    >
      <svg
        class="h-[23px] w-[23px]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </span>
    <span>{{ label }}</span>
    <span
      class="inline-block h-[7px] w-[7px] border-r-2 border-b-2 border-current"
      style="transform: rotate(45deg) translateY(-2px);"
      aria-hidden="true"
    ></span>
  </div>
</template>
