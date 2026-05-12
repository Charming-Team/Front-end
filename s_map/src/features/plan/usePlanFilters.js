import { computed } from 'vue'
import { PLAN_STATUS_OPTIONS } from './constants.js'

export function usePlanFilters(store) {
  const statusOptions = PLAN_STATUS_OPTIONS

  const status = computed({
    get: () => store.filters.status,
    set: value => { store.filters.status = value },
  })

  const search = computed({
    get: () => store.filters.search,
    set: value => { store.filters.search = value },
  })

  const hasFilters = computed(() => Boolean(search.value || status.value))

  function applyFilters() {
    store.applyFilters()
  }

  return {
    statusOptions,
    status,
    search,
    hasFilters,
    submitSearch: applyFilters,
    applyStatusFilter: applyFilters,
  }
}
