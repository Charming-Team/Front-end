import { computed, ref, reactive } from 'vue'
import { fetchPlanDetail, fetchLines, updatePlan, movePlanSchedule, fetchPlanUpdateHistory, fetchAllPlans } from './api.js'

const BLOCKED_MOVE_STATUSES = ['COMPLETED', 'CANCELLED']

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function clonePlan(plan) {
  return { ...plan }
}

function formatKstIso(date) {
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const pad = n => String(n).padStart(2, '0')
  return [
    `${kstDate.getUTCFullYear()}-${pad(kstDate.getUTCMonth() + 1)}-${pad(kstDate.getUTCDate())}`,
    `T${pad(kstDate.getUTCHours())}:${pad(kstDate.getUTCMinutes())}:${pad(kstDate.getUTCSeconds())}+09:00`,
  ].join('')
}

function formatDatetimeLocalKst(value) {
  if (!value) return value
  if (/([+-]\d{2}:\d{2}|Z)$/.test(value)) return value

  const [datePart, timePart = '00:00'] = value.split('T')
  const [hour = '00', minute = '00', second = '00'] = timePart.split(':')
  return `${datePart}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}+09:00`
}

function shiftDate(isoStr, deltaDays) {
  const date = new Date(isoStr)
  date.setDate(date.getDate() + deltaDays)
  return formatKstIso(date)
}

export function usePlanStore() {
  // ── Calendar state ─────────────────────────────────────────────────────────
  const calendarPlans   = ref([])
  const calendarLoading = ref(false)
  const calendarError   = ref(null)
  const calendarEditing = ref(false)
  const calendarDraftPlans = ref([])
  const calendarMovePreviewPlans = ref([])
  const calendarSaving = ref(false)
  const calendarSaveError = ref(null)
  const scheduleConflict = ref(null)

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

  const visibleCalendarPlans = computed(() =>
    calendarEditing.value ? calendarDraftPlans.value : calendarPlans.value
  )

  const calendarPreviewPlans = computed(() => calendarMovePreviewPlans.value)

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

  function enterCalendarEditMode() {
    calendarDraftPlans.value = calendarPlans.value.map(clonePlan)
    calendarMovePreviewPlans.value = []
    calendarSaveError.value = null
    scheduleConflict.value = null
    calendarEditing.value = true
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
        lineId:          editForm.lineId,
        operatorId:      selectedPlan.value.operatorId,
        plannedStartAt:  formatDatetimeLocalKst(editForm.plannedStartAt),
        plannedEndAt:    formatDatetimeLocalKst(editForm.plannedEndAt),
        plannedQuantity: editForm.plannedQuantity,
        planSequence:    editForm.planSequence,
        planStatus:      selectedPlan.value.planStatus,
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

  async function movePlan(planId, deltaDays, revert) {
    if (!calendarEditing.value) {
      revert()
      return
    }

    const previousDraftPlans = calendarDraftPlans.value.map(clonePlan)
    const nextDraftPlans = previousDraftPlans.map(clonePlan)
    const planIndex = nextDraftPlans.findIndex(plan => plan.planId === planId)
    const plan = nextDraftPlans[planIndex]

    if (!plan || BLOCKED_MOVE_STATUSES.includes(plan.planStatus)) {
      revert()
      return
    }

    const movedPlan = {
      ...plan,
      plannedStartAt: shiftDate(plan.plannedStartAt, deltaDays),
      plannedEndAt: shiftDate(plan.plannedEndAt, deltaDays),
    }

    nextDraftPlans[planIndex] = movedPlan

    calendarSaving.value = true
    calendarSaveError.value = null
    calendarMovePreviewPlans.value = []
    scheduleConflict.value = null
    calendarDraftPlans.value = nextDraftPlans

    try {
      await movePlanSchedule(planId, {
        lineId: movedPlan.lineId,
        plannedStartAt: movedPlan.plannedStartAt,
        plannedEndAt: movedPlan.plannedEndAt,
      })

      const selectedPlanId = selectedPlan.value?.planId ?? null
      await loadCalendarPlans()
      calendarDraftPlans.value = calendarPlans.value.map(clonePlan)
      if (selectedPlanId != null) {
        await Promise.all([
          loadPlanDetail(selectedPlanId),
          loadUpdateHistory(selectedPlanId),
        ])
      }
    } catch (e) {
      revert()
      calendarDraftPlans.value = previousDraftPlans

      if (e.code === '409-601') {
        scheduleConflict.value = {
          planId,
          message: e.message ?? '해당 라인에 중복된 생산계획이 있습니다. AI 분석이 필요합니다.',
        }
        return
      }

      calendarSaveError.value = e.message ?? '생산계획 일정을 이동하지 못했습니다.'
    } finally {
      calendarSaving.value = false
    }
  }

  function previewPlanMove(planId, deltaDays) {
    if (!calendarEditing.value) {
      calendarMovePreviewPlans.value = []
      return
    }

    const nextDraftPlans = calendarDraftPlans.value.map(clonePlan)
    const planIndex = nextDraftPlans.findIndex(plan => plan.planId === planId)
    const plan = nextDraftPlans[planIndex]

    if (!plan || BLOCKED_MOVE_STATUSES.includes(plan.planStatus)) {
      calendarMovePreviewPlans.value = []
      return
    }

    nextDraftPlans[planIndex] = {
      ...plan,
      plannedStartAt: shiftDate(plan.plannedStartAt, deltaDays),
      plannedEndAt: shiftDate(plan.plannedEndAt, deltaDays),
    }

    calendarMovePreviewPlans.value = [nextDraftPlans[planIndex]]
  }

  function clearPlanMovePreview() {
    calendarMovePreviewPlans.value = []
  }

  function completeCalendarEdit() {
    if (!calendarEditing.value) return
    if (calendarSaving.value) return
    calendarEditing.value = false
    calendarDraftPlans.value = []
    calendarMovePreviewPlans.value = []
    calendarSaveError.value = null
  }

  function closeScheduleConflict() {
    scheduleConflict.value = null
  }

  return {
    // calendar
    calendarPlans, visibleCalendarPlans, calendarPreviewPlans, calendarLoading, calendarError,
    calendarEditing, calendarSaving, calendarSaveError, scheduleConflict,
    filters,
    loadCalendarPlans, applyFilters,
    enterCalendarEditMode, movePlan, previewPlanMove, clearPlanMovePreview, completeCalendarEdit, closeScheduleConflict,
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
