<script setup>
import AppButton from '../../../components/common/AppButton.vue'

defineProps({
  label: { type: String, default: '챗봇' },
})
</script>

<template>
  <AppButton
    class="fixed bottom-[18px] right-[18px] z-30 min-h-[52px] rounded-full bg-[linear-gradient(135deg,#1565c0,#0d47a1)] px-[18px] text-white shadow-[0_16px_30px_rgba(13,71,161,0.28)] hover:bg-[linear-gradient(135deg,#0d5ab1,#0b3e89)] md:bottom-[26px] md:right-[26px] md:min-h-[58px] md:px-[22px]"
    :aria-label="label"
  >
    <span class="inline-flex size-7 items-center justify-center gap-[3px] rounded-full bg-white/15" aria-hidden="true">
      <i class="size-1 rounded-full bg-current"></i>
      <i class="size-1 rounded-full bg-current"></i>
      <i class="size-1 rounded-full bg-current"></i>
    </span>
    <span>{{ label }}</span>
  </AppButton>
</template>
