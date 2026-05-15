<script setup>
const props = defineProps({
  level: { type: String, default: '' },
})

const COLOR_MAP = {
  '매우 위험': { backgroundColor: '#FEE2E2', color: '#DC2626' },
  '위험':      { backgroundColor: '#FEF3C7', color: '#D97706' },
  '주의':      { backgroundColor: '#FFF7ED', color: '#EA580C' },
  '안전':      { backgroundColor: '#D1FAE5', color: '#059669' },
}

const style = COLOR_MAP[props.level] ?? { backgroundColor: '#F1F5F9', color: '#64748B' }
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-bold"
    :style="style"
  >{{ level }}</span>
</template>
