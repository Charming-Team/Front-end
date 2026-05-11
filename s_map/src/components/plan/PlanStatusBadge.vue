<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const STATUS_MAP = {
  SCHEDULED:   { label: '예정', className: 'bg-blue-50 text-[#1565c0]' },
  IN_PROGRESS: { label: '진행중', className: 'bg-teal-50 text-[#00897b]' },
  COMPLETED:   { label: '완료', className: 'bg-slate-100 text-[#546e7a]' },
  DELAYED:     { label: '지연', className: 'bg-red-50 text-[#c62828]' },
  CANCELLED:   { label: '취소', className: 'bg-zinc-100 text-[#757575]' },
}

const info = computed(() => STATUS_MAP[props.status] ?? { label: props.status, className: 'bg-slate-100 text-slate-500' })
</script>

<template>
  <span class="inline-grid h-7 place-items-center rounded-md px-2.5 text-[13px] font-bold whitespace-nowrap" :class="info.className">
    {{ info.label }}
  </span>
</template>
