<script setup>
import AppButton from '../common/AppButton.vue'
import PlanCalendarContainer from '../../features/plan/PlanCalendarContainer.vue'

defineProps({
  plans: { type: Array, default: () => [] },
  lines: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hasFilters: { type: Boolean, default: false },
  selectedPlanId: { type: [Number, null], default: null },
})

const emit = defineEmits(['retry', 'select-plan'])
</script>

<template>
  <div v-if="loading" class="state-box">
    <div class="spinner" aria-label="로딩 중"></div>
    <span>데이터를 불러오는 중입니다...</span>
  </div>

  <div v-else-if="error" class="state-box error-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>{{ error }}</span>
    <AppButton variant="danger-outline" @click="emit('retry')">다시 시도</AppButton>
  </div>

  <div v-else-if="plans.length === 0" class="state-box">
    <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
    <span>{{ hasFilters ? '검색 결과가 없습니다.' : '생산계획 데이터가 없습니다.' }}</span>
  </div>

  <PlanCalendarContainer
    v-else
    :plans="plans"
    :lines="lines"
    :selected-plan-id="selectedPlanId"
    @select-plan="emit('select-plan', $event)"
  />
</template>

<style scoped src="./styles/plan-calendar-panel.css"></style>
