import { computed, ref, reactive } from 'vue'
import { fetchPlanDetail, fetchLines, updatePlan, updatePlans, fetchPlanUpdateHistory, fetchAllPlans } from './api.js'

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

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function shiftDate(isoStr, deltaDays) {
  const date = new Date(isoStr)
  date.setDate(date.getDate() + deltaDays)
  return date.toISOString()
}

function calendarRangesOverlap(left, right) {
  const leftStart = startOfDay(left.plannedStartAt)
  const leftEnd = startOfDay(left.plannedEndAt)
  const rightStart = startOfDay(right.plannedStartAt)
  const rightEnd = startOfDay(right.plannedEndAt)
  return leftStart <= rightEnd && leftEnd >= rightStart
}

function movePlanAfter(anchorPlan, targetPlan) {
  const durationMs = new Date(targetPlan.plannedEndAt) - new Date(targetPlan.plannedStartAt)
  const targetStart = new Date(targetPlan.plannedStartAt)
  const nextStartDay = addDays(startOfDay(anchorPlan.plannedEndAt), 1)
  const nextStart = new Date(targetStart)
  nextStart.setFullYear(nextStartDay.getFullYear(), nextStartDay.getMonth(), nextStartDay.getDate())

  return {
    ...targetPlan,
    plannedStartAt: nextStart.toISOString(),
    plannedEndAt: new Date(nextStart.getTime() + durationMs).toISOString(),
  }
}

function hasScheduleChange(left, right) {
  return left.plannedStartAt !== right.plannedStartAt || left.plannedEndAt !== right.plannedEndAt
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
    calendarEditing.value = true
  }

  function resolveDraftOverlaps(movedPlanId, plans) {
    const movedPlan = plans.find(plan => plan.planId === movedPlanId)
    if (!movedPlan) return null

    const blockedOverlap = plans.some(plan =>
      plan.planId !== movedPlanId &&
      plan.lineId === movedPlan.lineId &&
      BLOCKED_MOVE_STATUSES.includes(plan.planStatus) &&
      calendarRangesOverlap(movedPlan, plan)
    )
    if (blockedOverlap) return null

    const resolvedPlans = plans.map(clonePlan)
    let anchorPlan = resolvedPlans.find(plan => plan.planId === movedPlanId)
    const editableLinePlans = resolvedPlans
      .filter(plan =>
        plan.planId !== movedPlanId &&
        plan.lineId === movedPlan.lineId &&
        !BLOCKED_MOVE_STATUSES.includes(plan.planStatus)
      )
      .sort((left, right) =>
        new Date(left.plannedStartAt) - new Date(right.plannedStartAt) ||
        (left.planSequence ?? 0) - (right.planSequence ?? 0)
      )

    for (const plan of editableLinePlans) {
      if (startOfDay(plan.plannedEndAt) < startOfDay(movedPlan.plannedStartAt)) continue
      const currentPlan = resolvedPlans.find(item => item.planId === plan.planId)
      if (startOfDay(currentPlan.plannedStartAt) > startOfDay(anchorPlan.plannedEndAt)) {
        anchorPlan = currentPlan
        continue
      }

      const pushedPlan = movePlanAfter(anchorPlan, currentPlan)
      const pushedIndex = resolvedPlans.findIndex(item => item.planId === pushedPlan.planId)
      resolvedPlans[pushedIndex] = pushedPlan
      anchorPlan = pushedPlan
    }

    return resolvedPlans
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

  function movePlan(planId, deltaDays, revert) {
    if (!calendarEditing.value) {
      revert()
      return
    }

    const nextDraftPlans = calendarDraftPlans.value.map(clonePlan)
    const planIndex = nextDraftPlans.findIndex(plan => plan.planId === planId)
    const plan = nextDraftPlans[planIndex]

    if (!plan || BLOCKED_MOVE_STATUSES.includes(plan.planStatus)) {
      revert()
      return
    }

    nextDraftPlans[planIndex] = {
      ...plan,
      plannedStartAt: shiftDate(plan.plannedStartAt, deltaDays),
      plannedEndAt: shiftDate(plan.plannedEndAt, deltaDays),
    }

    const resolvedPlans = resolveDraftOverlaps(planId, nextDraftPlans)
    if (!resolvedPlans) {
      revert()
      calendarSaveError.value = '완료 또는 취소 상태의 계획과 겹치도록 이동할 수 없습니다.'
      return
    }

    calendarSaveError.value = null
    calendarMovePreviewPlans.value = []
    calendarDraftPlans.value = resolvedPlans
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

    const resolvedPlans = resolveDraftOverlaps(planId, nextDraftPlans)
    if (!resolvedPlans) {
      calendarMovePreviewPlans.value = []
      return
    }

    calendarMovePreviewPlans.value = resolvedPlans.filter(resolvedPlan => {
      if (resolvedPlan.planId === planId) return false
      const draftPlan = calendarDraftPlans.value.find(item => item.planId === resolvedPlan.planId)
      return draftPlan && hasScheduleChange(draftPlan, resolvedPlan)
    })
  }

  function clearPlanMovePreview() {
    calendarMovePreviewPlans.value = []
  }

  async function completeCalendarEdit() {
    if (!calendarEditing.value) return

    const changedPlans = calendarDraftPlans.value
      .filter(draftPlan => {
        const originalPlan = calendarPlans.value.find(plan => plan.planId === draftPlan.planId)
        return originalPlan && hasScheduleChange(originalPlan, draftPlan)
      })

    if (changedPlans.length === 0) {
      calendarEditing.value = false
      calendarDraftPlans.value = []
      calendarMovePreviewPlans.value = []
      calendarSaveError.value = null
      return
    }

    calendarSaving.value = true
    calendarSaveError.value = null
    try {
      await updatePlans(changedPlans.map(plan => ({
        planId: plan.planId,
        plannedStartAt: plan.plannedStartAt,
        plannedEndAt: plan.plannedEndAt,
        lineId: plan.lineId,
        planSequence: plan.planSequence,
        plannedQuantity: plan.plannedQuantity,
      })))
      const selectedPlanId = selectedPlan.value?.planId ?? null
      calendarEditing.value = false
      calendarDraftPlans.value = []
      calendarMovePreviewPlans.value = []
      await loadCalendarPlans()
      if (selectedPlanId != null) {
        await Promise.all([
          loadPlanDetail(selectedPlanId),
          loadUpdateHistory(selectedPlanId),
        ])
      }
    } catch (e) {
      calendarSaveError.value = e.message ?? '캘린더 수정 내용을 저장하지 못했습니다.'
    } finally {
      calendarSaving.value = false
    }
  }

  return {
    // calendar
    calendarPlans, visibleCalendarPlans, calendarPreviewPlans, calendarLoading, calendarError,
    calendarEditing, calendarSaving, calendarSaveError,
    filters,
    loadCalendarPlans, applyFilters,
    enterCalendarEditMode, movePlan, previewPlanMove, clearPlanMovePreview, completeCalendarEdit,
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
