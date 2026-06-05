<script setup>
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PlanScreen from '../../features/plan/PlanScreen.vue'
import { usePlanStore } from '../../features/plan/store.js'
import { usePlanFilters } from '../../features/plan/usePlanFilters.js'

const store = usePlanStore()
const filters = usePlanFilters(store)
const route = useRoute()

function normalizePlanId(value) {
  const raw = Array.isArray(value) ? value[0] : value
  const planId = Number(raw)
  return Number.isInteger(planId) && planId > 0 ? planId : null
}

function loadRoutedPlanDetail(value) {
  const planId = normalizePlanId(value)
  if (planId) store.loadPlanDetail(planId)
}

onMounted(async () => {
  await Promise.all([
    store.loadCalendarPlans(),
    store.loadLines(),
  ])
  loadRoutedPlanDetail(route.query.planId)
})

watch(() => route.query.planId, loadRoutedPlanDetail)
</script>

<template>
  <PlanScreen :store="store" :filters="filters" />
</template>
