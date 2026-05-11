import { ref, reactive } from 'vue'
import { fetchPlanDetail, fetchLines, updatePlan, fetchPlanUpdateHistory, fetchAllPlans } from './api.js'

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function usePlanStore() {
  // ── Calendar state ─────────────────────────────────────────────────────────
  const calendarPlans   = ref([])
  const calendarLoading = ref(false)
  const calendarError   = ref(null)

  const filters = reactive({
    status:   '',
    search:   '',
    page:     1,
    pageSize: 15,
  })

  // ── Detail state ────────────────────────────────────────────────────────────
  const selectedPlan  = ref(null)
  const detailLoading = ref(false)
  const detailError   = ref(null)

  // ── PLAN-002: edit state ────────────────────────────────────────────────────
  const isEditing    = ref(false)
  const editForm     = reactive({
    plannedStartAt:  '',
    plannedEndAt:    '',
    lineId:          null,
    planSequence:    1,
    plannedQuantity: 0,
  })
  const editErrors     = ref({})
  const updateLoading  = ref(false)
  const updateError    = ref(null)
  const updateSuccess  = ref(false)
  const updateHistory  = ref([])
  const historyLoading = ref(false)
  const lines          = ref([])

  // ── Calendar actions ────────────────────────────────────────────────────────
  async function loadCalendarPlans() {
    calendarLoading.value = true
    calendarError.value   = null
    try {
      const res             = await fetchAllPlans({ status: filters.status, search: filters.search })
      calendarPlans.value   = res.data
    } catch (e) {
      calendarError.value   = e.message ?? '데이터를 불러오지 못했습니다.'
      calendarPlans.value   = []
    } finally {
      calendarLoading.value = false
    }
  }

  function applyFilters() {
    filters.page = 1
    loadCalendarPlans()
  }

  // ── Detail actions ──────────────────────────────────────────────────────────
  async function loadPlanDetail(planId) {
    detailLoading.value = true
    detailError.value   = null
    try {
      selectedPlan.value  = await fetchPlanDetail(planId)
    } catch (e) {
      detailError.value   = e.message ?? '상세 정보를 불러오지 못했습니다.'
      selectedPlan.value  = null
    } finally {
      detailLoading.value = false
    }
  }

  function clearSelectedPlan() {
    selectedPlan.value  = null
    detailError.value   = null
    isEditing.value     = false
    editErrors.value    = {}
    updateError.value   = null
    updateSuccess.value = false
    updateHistory.value = []
  }

  // ── PLAN-002: edit / update actions ────────────────────────────────────────
  async function loadLines() {
    try {
      lines.value = await fetchLines()
    } catch {
      lines.value = []
    }
  }

  async function loadUpdateHistory(planId) {
    historyLoading.value = true
    try {
      updateHistory.value  = await fetchPlanUpdateHistory(planId)
    } catch {
      updateHistory.value  = []
    } finally {
      historyLoading.value = false
    }
  }

  function enterEditMode() {
    const plan = selectedPlan.value
    if (!plan) return
    Object.assign(editForm, {
      plannedStartAt:  toDatetimeLocal(plan.plannedStartAt),
      plannedEndAt:    toDatetimeLocal(plan.plannedEndAt),
      lineId:          plan.lineId,
      planSequence:    plan.planSequence,
      plannedQuantity: plan.plannedQuantity,
    })
    editErrors.value    = {}
    updateError.value   = null
    updateSuccess.value = false
    isEditing.value     = true
  }

  function exitEditMode() {
    isEditing.value   = false
    editErrors.value  = {}
    updateError.value = null
  }

  async function submitUpdate() {
    if (!selectedPlan.value) return
    updateLoading.value  = true
    updateError.value    = null
    editErrors.value     = {}
    updateSuccess.value  = false
    try {
      await updatePlan(selectedPlan.value.planId, {
        plannedStartAt:  editForm.plannedStartAt,
        plannedEndAt:    editForm.plannedEndAt,
        lineId:          editForm.lineId,
        planSequence:    editForm.planSequence,
        plannedQuantity: editForm.plannedQuantity,
      })
      isEditing.value     = false
      updateSuccess.value = true
      const planId = selectedPlan.value.planId
      await Promise.all([
        loadPlanDetail(planId),
        loadCalendarPlans(),
        loadUpdateHistory(planId),
      ])
    } catch (e) {
      if (e.validationErrors) editErrors.value = e.validationErrors
      updateError.value = e.message ?? '수정 중 오류가 발생했습니다.'
    } finally {
      updateLoading.value = false
    }
  }

  return {
    // calendar
    calendarPlans, calendarLoading, calendarError,
    filters,
    loadCalendarPlans, applyFilters,
    // detail
    selectedPlan, detailLoading, detailError,
    loadPlanDetail, clearSelectedPlan,
    // edit / update (PLAN-002)
    isEditing, editForm, editErrors,
    updateLoading, updateError, updateSuccess,
    updateHistory, historyLoading,
    lines,
    loadLines, loadUpdateHistory,
    enterEditMode, exitEditMode, submitUpdate,
  }
}
