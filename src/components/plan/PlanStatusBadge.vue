<script setup>
import { computed } from 'vue'
import { PLAN_STATUS_LABELS } from '../../features/plan/constants.js'

const props = defineProps({
  status: { type: String, required: true },
})

const STATUS_CLASSES = {
  SCHEDULED:   'plan-status-badge-scheduled',
  IN_PROGRESS: 'plan-status-badge-in-progress',
  COMPLETED:   'plan-status-badge-completed',
  DELAYED:     'plan-status-badge-delayed',
  CANCELLED:   'plan-status-badge-cancelled',
}

const info = computed(() => ({
  label: PLAN_STATUS_LABELS[props.status] ?? props.status,
  className: STATUS_CLASSES[props.status] ?? 'plan-status-badge-unknown',
}))
</script>

<template>
  <span class="plan-status-badge" :class="info.className">
    {{ info.label }}
  </span>
</template>

<style scoped src="./styles/plan-status-badge.css"></style>
