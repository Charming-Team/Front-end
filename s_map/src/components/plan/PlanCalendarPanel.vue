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
  <div v-if="loading" class="flex min-h-[260px] flex-col items-center justify-center gap-3.5 text-[15px] font-medium text-slate-500">
    <div class="size-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#1565c0]" aria-label="로딩 중"></div>
    <span>데이터를 불러오는 중입니다...</span>
  </div>

  <div v-else-if="error" class="flex min-h-[260px] flex-col items-center justify-center gap-3.5 text-[15px] font-medium text-red-700">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-10 opacity-100">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>{{ error }}</span>
    <AppButton variant="danger-outline" @click="emit('retry')">다시 시도</AppButton>
  </div>

  <div v-else-if="plans.length === 0" class="flex min-h-[260px] flex-col items-center justify-center gap-3.5 text-[15px] font-medium text-slate-500">
    <svg viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="size-10 opacity-50">
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
