<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const STATUS_MAP = {
  SCHEDULED:   { label: '예정', className: 'plan-status-badge--scheduled' },
  IN_PROGRESS: { label: '진행중', className: 'plan-status-badge--in-progress' },
  COMPLETED:   { label: '완료', className: 'plan-status-badge--completed' },
  DELAYED:     { label: '지연', className: 'plan-status-badge--delayed' },
  CANCELLED:   { label: '취소', className: 'plan-status-badge--cancelled' },
}

const info = computed(() => STATUS_MAP[props.status] ?? { label: props.status, className: 'plan-status-badge--unknown' })
</script>

<template>
  <span class="plan-status-badge" :class="info.className">
    {{ info.label }}
  </span>
</template>

<style scoped src="./styles/plan-status-badge.css"></style>
