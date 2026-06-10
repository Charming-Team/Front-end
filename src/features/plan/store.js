import { computed, ref, reactive } from 'vue'
import {
  fetchPlanDetail,
  fetchLines,
  updatePlan,
  movePlanSchedule,
  fetchPlanUpdateHistory,
  fetchAllPlans,
  generatePlanAiRecommendation,
  saveSelectedPlanSimulation,
} from './api.js'

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

function getKstParts(value) {
  const date = new Date(value)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return {
    year: kstDate.getUTCFullYear(),
    monthIndex: kstDate.getUTCMonth(),
  }
}

function formatKstMonthStart(year, monthIndex) {
  const normalized = new Date(Date.UTC(year, monthIndex, 1))
  const pad = n => String(n).padStart(2, '0')
  return `${normalized.getUTCFullYear()}-${pad(normalized.getUTCMonth() + 1)}-01T00:00:00+09:00`
}

function getPlanningWindow(plan) {
  const startParts = getKstParts(plan.plannedStartAt)
  const endParts = getKstParts(plan.plannedEndAt)
  const startIndex = startParts.year * 12 + startParts.monthIndex
  const endIndex = endParts.year * 12 + endParts.monthIndex
  const windowStartIndex = Math.min(startIndex, endIndex)
  const windowEndIndex = Math.max(startIndex, endIndex) + 1

  return {
    planningStart: formatKstMonthStart(Math.floor(windowStartIndex / 12), windowStartIndex % 12),
    planningEnd: formatKstMonthStart(Math.floor(windowEndIndex / 12), windowEndIndex % 12),
  }
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'string') {
    const normalized = value.startsWith('PLAN-') ? value.slice(5) : value
    const number = Number(normalized)
    return Number.isFinite(number) ? number : fallback
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function roundHours(value) {
  const number = toNumber(value, 0)
  return Math.round(number * 100) / 100
}

function pick(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return fallback
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function toOffsetDateTime(value) {
  if (!value) return value
  if (value instanceof Date) return formatKstIso(value)
  const text = String(value)
  if (/([+-]\d{2}:\d{2}|Z)$/.test(text)) return text
  if (/[+-]\d{4}$/.test(text)) {
    return `${text.slice(0, -5)}${text.slice(-5, -2)}:${text.slice(-2)}`
  }
  return `${text}+09:00`
}

function delayHoursFromMetrics(metrics = {}) {
  const totalTardinessMinutes = pick(metrics, ['total_tardiness_minutes', 'totalTardinessMinutes'])
  if (totalTardinessMinutes !== null) return roundHours(Number(totalTardinessMinutes) / 60)

  const expectedDelayDays = pick(metrics, ['expected_delay_days', 'expectedDelayDays'])
  if (expectedDelayDays !== null) return roundHours(Number(expectedDelayDays) * 24)

  const p95Minutes = pick(metrics, ['p95_tardiness_minutes', 'p95TardinessMinutes'])
  if (p95Minutes !== null) return roundHours(Number(p95Minutes) / 60)

  return 0
}

function rateFromPercent(value) {
  const number = toNumber(value)
  return number === null ? null : Math.round((number / 100) * 10000) / 10000
}

function resolveSelectedPlanOrderId(plan = {}, planIdToPlan = new Map()) {
  const explicitOrderId = toNumber(pick(plan, [
    'customer_order_id',
    'customerOrderId',
    'source_order_id',
    'sourceOrderId',
    'customer_id',
    'customerId',
  ]))
  if (explicitOrderId !== null) return explicitOrderId

  const planId = toNumber(pick(plan, ['plan_id', 'planId', 'schedule_id', 'scheduleId', 'order_id', 'orderId']))
  const mappedOrderId = planIdToPlan.get(String(planId))?.orderId
  if (mappedOrderId !== undefined && mappedOrderId !== null) return mappedOrderId

  return null
}

function resolveSelectedPlanId(plan = {}, planIdToPlan = new Map()) {
  const explicitPlanId = toNumber(pick(plan, ['plan_id', 'planId', 'schedule_id', 'scheduleId']))
  if (explicitPlanId !== null) return explicitPlanId

  const candidatePlanId = toNumber(pick(plan, ['order_id', 'orderId']))
  return planIdToPlan.has(String(candidatePlanId)) ? candidatePlanId : null
}

function resolveSelectedPlanOperatorId(plan = {}, planId, planIdToPlan = new Map()) {
  const aiOperatorId = toNumber(pick(plan, ['operator_id', 'operatorId']))
  if (aiOperatorId !== null) return aiOperatorId

  if (planId === null || planId === undefined) return null

  return toNumber(planIdToPlan.get(String(planId))?.operatorId)
}

function compareSelectedPlansForSequence(left, right) {
  return (
    toNumber(left.lineId, 0) - toNumber(right.lineId, 0)
    || new Date(left.plannedStartAt) - new Date(right.plannedStartAt)
    || new Date(left.plannedEndAt) - new Date(right.plannedEndAt)
    || toNumber(left.planId, 0) - toNumber(right.planId, 0)
  )
}

function assignConflictFreePlanSequences(selectedPlans, allPlans = []) {
  const selectedPlanIds = new Set(
    selectedPlans
      .map(plan => plan.planId)
      .filter(planId => planId !== null && planId !== undefined)
      .map(planId => String(planId))
  )
  const usedSequencesByLine = new Map()
  const maxSequenceByLine = new Map()

  allPlans.forEach(plan => {
    const planId = toNumber(plan?.planId)
    if (planId !== null && selectedPlanIds.has(String(planId))) return

    const lineId = toNumber(plan?.lineId)
    const sequence = toNumber(plan?.planSequence)
    if (lineId === null || sequence === null || sequence <= 0) return

    const lineKey = String(lineId)
    if (!usedSequencesByLine.has(lineKey)) usedSequencesByLine.set(lineKey, new Set())
    usedSequencesByLine.get(lineKey).add(sequence)
    maxSequenceByLine.set(lineKey, Math.max(maxSequenceByLine.get(lineKey) ?? 0, sequence))
  })

  const assignedSequences = new Map()
  selectedPlans
    .map((plan, index) => ({ plan, index }))
    .sort((left, right) => compareSelectedPlansForSequence(left.plan, right.plan))
    .forEach(({ plan, index }) => {
      const lineKey = String(plan.lineId)
      if (!usedSequencesByLine.has(lineKey)) usedSequencesByLine.set(lineKey, new Set())
      const usedSequences = usedSequencesByLine.get(lineKey)
      const desiredSequence = toNumber(plan.planSequence)
      let sequence = desiredSequence !== null && desiredSequence > 0 && !usedSequences.has(desiredSequence)
        ? desiredSequence
        : (maxSequenceByLine.get(lineKey) ?? 0) + 1

      while (usedSequences.has(sequence)) {
        sequence += 1
      }

      usedSequences.add(sequence)
      maxSequenceByLine.set(lineKey, Math.max(maxSequenceByLine.get(lineKey) ?? 0, sequence))
      assignedSequences.set(index, sequence)
    })

  return selectedPlans.map((plan, index) => ({
    ...plan,
    planSequence: assignedSequences.get(index) ?? plan.planSequence,
  }))
}

function formatPlanConflictLabel(plan = {}) {
  const planId = plan.planId ?? plan.scheduleId ?? '-'
  const orderId = plan.orderId ?? '-'
  return `plan ${planId}, order ${orderId}`
}

function findSelectedPlanScheduleOverlaps(plans = []) {
  const plansByLine = new Map()

  plans.forEach((plan, index) => {
    const lineId = toNumber(plan.lineId)
    const start = new Date(plan.plannedStartAt)
    const end = new Date(plan.plannedEndAt)
    if (lineId === null || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return

    const lineKey = String(lineId)
    if (!plansByLine.has(lineKey)) plansByLine.set(lineKey, [])
    plansByLine.get(lineKey).push({ plan, index, start, end })
  })

  const overlaps = []
  plansByLine.forEach((linePlans, lineId) => {
    const sortedPlans = linePlans
      .filter(item => item.start < item.end)
      .sort((left, right) => left.start - right.start || left.end - right.end)

    let previous = null
    sortedPlans.forEach(current => {
      if (previous && current.start < previous.end) {
        overlaps.push({
          lineId,
          left: previous.plan,
          right: current.plan,
          leftIndex: previous.index,
          rightIndex: current.index,
        })
      }

      if (!previous || current.end > previous.end) {
        previous = current
      }
    })
  })

  return overlaps
}

function recommendationGradeFromAlternative(alternative = {}) {
  const aiEvaluation = pick(alternative, ['ai_evaluation', 'aiEvaluation'], {})
  const level = pick(aiEvaluation, ['recommendation_level', 'recommendationLevel'], '')
  if (['STRONG_RECOMMEND', 'RECOMMEND'].includes(level)) return 'HIGH'
  if (level === 'NEUTRAL' || level === 'INFO_ONLY') return 'MEDIUM'
  if (level === 'NOT_RECOMMEND') return 'LOW'
  return 'MEDIUM'
}

function getPlanVariantCode(item = {}) {
  return pick(item, ['plan_variant_code', 'planVariantCode'], '')
}

function getPlanVariantName(item = {}) {
  return pick(item, ['plan_variant_name', 'planVariantName'], getPlanVariantCode(item))
}

function getPlanDelayStatus(plan = {}, alternative = {}) {
  const orderId = String(pick(plan, ['order_id', 'orderId'], ''))
  const change = asArray(pick(alternative, ['selected_plan_change_schedule', 'selectedPlanChangeSchedule'], []))
    .find(row => String(pick(row, ['order_id', 'orderId'], '')) === orderId)
  const changeStatus = pick(change, ['delay_status_change', 'delayStatusChange'], '')

  if (changeStatus === 'IMPROVED') return false
  if (changeStatus === 'WORSENED') return true

  return pick(plan, ['plan_status', 'planStatus'], '') === 'DELAYED'
}

function normalizeUnscheduledPlanIds(candidate = {}) {
  const explicitPlanIds = asArray(pick(candidate, ['unscheduled_plan_ids', 'unscheduledPlanIds'], []))
    .map(value => toNumber(value))
    .filter(value => value !== null)

  if (explicitPlanIds.length > 0) return [...new Set(explicitPlanIds)]

  return [
    ...new Set(
      asArray(pick(candidate, ['unscheduled_orders', 'unscheduledOrders'], []))
        .map(value => toNumber(value))
        .filter(value => value !== null)
    ),
  ]
}

function getUnscheduledWarningText(option = {}) {
  const ids = asArray(option.unscheduledPlanIds)
  if (ids.length === 0) return ''

  const preview = ids.slice(0, 5).join(', ')
  const suffix = ids.length > 5 ? ` 외 ${ids.length - 5}건` : ''
  return `미배정 생산계획 ${ids.length}건이 있어 바로 반영할 수 없습니다. 대상: ${preview}${suffix}`
}

function normalizeAiRecommendations(response) {
  const planningResponse = pick(response, ['planning_response', 'planningResponse'], {})
  const simulationResponse = pick(response, ['simulation_response', 'simulationResponse'], {})
  const candidates = asArray(pick(planningResponse, ['adjusted_plan_candidates', 'adjustedPlanCandidates'], []))
  const alternatives = asArray(pick(simulationResponse, ['alternatives'], []))
  const baseline = pick(simulationResponse, ['baseline'], {})
  const baselineMetrics = pick(baseline, ['simulation_metrics', 'simulationMetrics', 'current_state_summary', 'currentStateSummary'], {})
  const beforeDelayHr = delayHoursFromMetrics(baselineMetrics)

  return candidates.map((candidate) => {
    const variantCode = getPlanVariantCode(candidate)
    const alternative = alternatives.find(item => getPlanVariantCode(item) === variantCode) ?? {}
    const simulationMetrics = pick(alternative, ['simulation_metrics', 'simulationMetrics'], {})
    const computedDeltas = pick(alternative, ['computed_deltas', 'computedDeltas'], {})
    const aiEvaluation = pick(alternative, ['ai_evaluation', 'aiEvaluation'], {})
    const aiRecommendation = pick(aiEvaluation, ['ai_recommendation', 'aiRecommendation'], {})
    const afterDelayHr = delayHoursFromMetrics(simulationMetrics)
    const expectedDelayDaysReduction = pick(computedDeltas, ['expected_delay_days_reduction', 'expectedDelayDaysReduction'])
    const calculatedReduction = expectedDelayDaysReduction !== null
      ? roundHours(Number(expectedDelayDaysReduction) * 24)
      : roundHours(beforeDelayHr - afterDelayHr)
    const delayReductionHr = Math.max(calculatedReduction, 0)
    const unscheduledPlanIds = normalizeUnscheduledPlanIds(candidate)

    return {
      variantCode,
      variantName: getPlanVariantName(candidate),
      status: pick(candidate, ['status'], '-'),
      plans: asArray(pick(candidate, ['plans'], [])),
      unscheduledPlanIds,
      unscheduledWarningText: getUnscheduledWarningText({ unscheduledPlanIds }),
      alternative,
      summaryText: pick(aiRecommendation, ['summary_text', 'summaryText'], 'AI 추천안을 생성했습니다.'),
      reasons: asArray(pick(aiRecommendation, ['reasons'], [])),
      beforeDelayHr,
      afterDelayHr,
      delayChangeHr: calculatedReduction,
      delayReductionHr,
      recommendationGrade: recommendationGradeFromAlternative(alternative),
      beforeAvgLineUtilizationRate: rateFromPercent(
        pick(baselineMetrics, ['avg_line_utilization_percent', 'avgLineUtilizationPercent'])
      ),
      afterAvgLineUtilizationRate: rateFromPercent(
        pick(simulationMetrics, ['avg_line_utilization_percent', 'avgLineUtilizationPercent'])
      ),
      costChangeAmount: pick(computedDeltas, ['risk_cost_saving_amount', 'riskCostSavingAmount']),
    }
  })
}

function buildSelectedSimulationPayload(option, planIdToPlan = new Map(), allPlans = []) {
  const actionResult = option.summaryText
  const costChangeAmount = toNumber(option.costChangeAmount)
  const selectedPlans = option.plans.map(plan => {
    const planId = resolveSelectedPlanId(plan, planIdToPlan)
    const beforePlan = planIdToPlan.get(String(planId))

    return {
      planId,
      scheduleId: planId,
      orderId: resolveSelectedPlanOrderId(plan, planIdToPlan),
      productId: toNumber(pick(plan, ['product_id', 'productId'])),
      lineId: toNumber(pick(plan, ['line_id', 'lineId'])),
      operatorId: resolveSelectedPlanOperatorId(plan, planId, planIdToPlan),
      plannedStartAt: toOffsetDateTime(pick(plan, ['planned_start_at', 'plannedStartAt'])),
      plannedEndAt: toOffsetDateTime(pick(plan, ['planned_end_at', 'plannedEndAt'])),
      estimatedDurationHr: roundHours(pick(plan, ['estimated_duration_hr', 'estimatedDurationHr'], 0)),
      plannedQuantity: toNumber(pick(plan, ['planned_quantity', 'plannedQuantity'], 0), 0),
      planSequence: toNumber(pick(plan, ['plan_sequence', 'planSequence'], 1), 1),
      planStatus: pick(plan, ['plan_status', 'planStatus'], 'SCHEDULED'),
      beforeLineId: beforePlan?.lineId ?? null,
      beforeSequence: beforePlan?.planSequence ?? null,
      beforeStartAt: beforePlan?.plannedStartAt ?? null,
      beforeEndAt: beforePlan?.plannedEndAt ?? null,
      beforeQuantity: beforePlan?.plannedQuantity ?? null,
      afterDelayed: getPlanDelayStatus(plan, option.alternative),
      changeReason: actionResult,
    }
  })
  const plans = assignConflictFreePlanSequences(selectedPlans, allPlans)

  return {
    simulationName: option.variantName || 'AI 생산계획 추천안',
    planVariantCode: option.variantCode,
    actionResult,
    beforeTotalDelayHr: option.beforeDelayHr,
    afterTotalDelayHr: option.afterDelayHr,
    delayReductionHr: option.delayReductionHr,
    beforeAvgLineUtilizationRate: option.beforeAvgLineUtilizationRate,
    afterAvgLineUtilizationRate: option.afterAvgLineUtilizationRate,
    beforeTotalProductionQuantity: plans.reduce((sum, plan) => sum + (plan.plannedQuantity || 0), 0),
    afterTotalProductionQuantity: plans.reduce((sum, plan) => sum + (plan.plannedQuantity || 0), 0),
    costChangeAmount: costChangeAmount === null ? null : Math.abs(costChangeAmount),
    recommendationGrade: option.recommendationGrade,
    plans,
  }
}

function mergePlansById(...planGroups) {
  const merged = new Map()
  planGroups.flat().forEach(plan => {
    if (plan?.planId == null) return
    merged.set(String(plan.planId), plan)
  })
  return [...merged.values()]
}

function validateSelectedSimulationPayload(payload) {
  const missingMappedPlans = payload.plans
    .filter(plan => plan.planId == null || plan.orderId == null)
    .slice(0, 5)
    .map(plan => plan.orderId ?? plan.planId ?? '-')

  if (missingMappedPlans.length > 0) {
    throw new Error(`생산계획 매핑을 확인하지 못했습니다. 대상: ${missingMappedPlans.join(', ')}`)
  }

  const overlaps = findSelectedPlanScheduleOverlaps(payload.plans)
  if (overlaps.length === 0) return

  if (import.meta.env.DEV) {
    console.warn('[Plan] selected simulation internal overlaps', overlaps)
  }

  const first = overlaps[0]
  throw new Error(
    `AI 추천안 내부에 같은 라인 일정 겹침이 있습니다. 라인 ${first.lineId}: `
    + `${formatPlanConflictLabel(first.left)} / ${formatPlanConflictLabel(first.right)}`
  )
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
  const aiRecommendationLoading = ref(false)
  const aiRecommendationError = ref(null)
  const aiRecommendationOptions = ref([])
  const selectedAiVariantCode = ref('')
  const applyingAiRecommendation = ref(false)

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
  const selectedAiRecommendation = computed(() =>
    aiRecommendationOptions.value.find(option => option.variantCode === selectedAiVariantCode.value) ?? null
  )

  // ── Calendar actions ────────────────────────────────────────────────────────
  async function loadCalendarPlans(range = {}) {
    calendarLoading.value = true
    calendarError.value   = null
    try {
      const res             = await fetchAllPlans({ status: filters.status, search: filters.search, ...range })
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
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''
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
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''
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
        const planningWindow = getPlanningWindow(movedPlan)
        scheduleConflict.value = {
          planId,
          message: e.message ?? '해당 라인에 중복된 생산계획이 있습니다. AI 분석이 필요합니다.',
          originalPlan: plan,
          movedPlan,
          payload: {
            planId,
            lineId: movedPlan.lineId,
            plannedStartAt: movedPlan.plannedStartAt,
            plannedEndAt: movedPlan.plannedEndAt,
            ...planningWindow,
          },
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
    aiRecommendationLoading.value = false
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''
    applyingAiRecommendation.value = false
  }

  function selectAiRecommendation(variantCode) {
    selectedAiVariantCode.value = variantCode
  }

  function getPlanIdToPlanMap(extraPlans = []) {
    const planIdToPlan = new Map()
    const plans = [
      ...extraPlans,
      ...calendarPlans.value,
      ...calendarDraftPlans.value,
      scheduleConflict.value?.movedPlan,
      scheduleConflict.value?.originalPlan,
      selectedPlan.value,
    ]

    plans.forEach(plan => {
      if (plan?.planId == null) return
      planIdToPlan.set(String(plan.planId), plan)
    })

    return planIdToPlan
  }

  async function generateScheduleAiRecommendation() {
    const conflict = scheduleConflict.value
    if (!conflict?.payload) return

    aiRecommendationLoading.value = true
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''

    try {
      const response = await generatePlanAiRecommendation(conflict.payload)
      const options = normalizeAiRecommendations(response)
      if (options.length === 0) {
        throw new Error('AI 추천안이 없습니다.')
      }

      aiRecommendationOptions.value = options
      selectedAiVariantCode.value = (
        options.find(option => option.unscheduledPlanIds.length === 0) ?? options[0]
      ).variantCode
    } catch (e) {
      aiRecommendationError.value = e.message ?? 'AI 추천안을 생성하지 못했습니다.'
    } finally {
      aiRecommendationLoading.value = false
    }
  }

  async function applySelectedAiRecommendation() {
    const option = selectedAiRecommendation.value
    const conflict = scheduleConflict.value
    if (!option || applyingAiRecommendation.value) return

    if (option.unscheduledPlanIds?.length > 0) {
      aiRecommendationError.value = option.unscheduledWarningText
        || '미배정 생산계획이 있는 추천안은 바로 반영할 수 없습니다.'
      return
    }

    applyingAiRecommendation.value = true
    aiRecommendationError.value = null
    let selectedSimulationPayload = null

    try {
      const latestPlansPromise = conflict?.payload?.planningStart && conflict?.payload?.planningEnd
        ? fetchAllPlans({
            startAt: conflict.payload.planningStart,
            endAt: conflict.payload.planningEnd,
          }).then(response => response.data)
        : Promise.resolve([])
      const allPlansPromise = fetchAllPlans().then(response => response.data)
      const [latestPlans, allPlans] = await Promise.all([latestPlansPromise, allPlansPromise])
      const referencePlans = mergePlansById(allPlans, latestPlans)
      const payload = buildSelectedSimulationPayload(
        option,
        getPlanIdToPlanMap(referencePlans),
        referencePlans
      )
      selectedSimulationPayload = payload
      if (import.meta.env.DEV) {
        console.debug('[Plan] selected simulation payload', payload)
      }
      validateSelectedSimulationPayload(payload)
      await saveSelectedPlanSimulation(payload)
      await loadCalendarPlans({
        startAt: conflict?.payload?.planningStart,
        endAt: conflict?.payload?.planningEnd,
      })
      calendarDraftPlans.value = calendarPlans.value.map(clonePlan)
      closeScheduleConflict()
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error('[Plan] selected simulation failed', {
          status: e.status,
          code: e.code,
          message: e.message,
          data: e.data,
          payload: selectedSimulationPayload,
        })
      }
      aiRecommendationError.value = e.message ?? 'AI 추천안 반영에 실패했습니다.'
    } finally {
      applyingAiRecommendation.value = false
    }
  }

  return {
    // calendar
    calendarPlans, visibleCalendarPlans, calendarPreviewPlans, calendarLoading, calendarError,
    calendarEditing, calendarSaving, calendarSaveError, scheduleConflict,
    aiRecommendationLoading, aiRecommendationError, aiRecommendationOptions,
    selectedAiVariantCode, selectedAiRecommendation, applyingAiRecommendation,
    filters,
    loadCalendarPlans, applyFilters,
    enterCalendarEditMode, movePlan, previewPlanMove, clearPlanMovePreview, completeCalendarEdit,
    closeScheduleConflict, generateScheduleAiRecommendation, selectAiRecommendation, applySelectedAiRecommendation,
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
