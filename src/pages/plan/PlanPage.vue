<script setup>
import { onMounted } from 'vue'
import PlanScreen from '../../features/plan/PlanScreen.vue'
import { usePlanStore } from '../../features/plan/store.js'
import { usePlanFilters } from '../../features/plan/usePlanFilters.js'

const store = usePlanStore()
const filters = usePlanFilters(store)

onMounted(() => {
  store.loadCalendarPlans()
  store.loadLines()
})
</script>

<template>
  <PlanScreen :store="store" :filters="filters" />
</template>
