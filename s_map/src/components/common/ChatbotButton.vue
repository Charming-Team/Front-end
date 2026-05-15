<script setup>
defineProps({
  label: { type: String, default: '챗봇' },
})
</script>

<template>
  <button
    type="button"
    class="fixed bottom-[26px] right-[26px] z-30 inline-flex min-h-[58px] cursor-pointer items-center gap-2 bg-gradient-to-br from-[#1565c0] to-[#0d47a1] px-[22px] font-bold text-white shadow-[0_16px_30px_rgba(13,71,161,0.28)] transition-all hover:from-[#0d5ab1] hover:to-[#0b3e89] max-md:bottom-[18px] max-md:right-[18px] max-md:min-h-[52px] max-md:px-[18px]"
    style="border-radius: 9999px;"
    :aria-label="label"
  >
    <span class="inline-flex h-7 w-7 items-center justify-center gap-[3px] rounded-full bg-white/[0.16]">
      <i class="block h-1 w-1 rounded-full bg-current"></i>
      <i class="block h-1 w-1 rounded-full bg-current"></i>
      <i class="block h-1 w-1 rounded-full bg-current"></i>
    </span>
    <span>{{ label }}</span>
  </button>
</template>
