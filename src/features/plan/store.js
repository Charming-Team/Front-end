import { computed, ref, reactive } from 'vue'
import {
  fetchPlanDetail,
  fetchLines,
  updatePlan,
  movePlanSchedule,
  fetchPlanUpdateHistory,
  fetchAllPlans,
  generatePlanAiRecommendation,
  generateMonthlyPlanAiAnalysis,
  saveSelectedPlanSimulation,
} from './api.js'
import {
  clearAiSimulationSession,
  loadAiSimulationSession,
  saveAiSimulationSession,
  updateAiSimulationSession,
} from '../ai/simulationSession.js'

const BLOCKED_MOVE_STATUSES = ['COMPLETED', 'CANCELLED']
const AI_EVALUATION_FALLBACK_TEXT = 'AI 평가 문구를 생성하지 못했습니다. 정량 지표를 기준으로 확인해주세요.'

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

function getPlanningWindow(...plans) {
  const timestamps = plans
    .flatMap(plan => [plan?.plannedStartAt, plan?.plannedEndAt])
    .map(value => new Date(value).getTime())
    .filter(Number.isFinite)
  if (timestamps.length === 0) {
    const now = new Date()
    return {
      planningStart: formatKstIso(now),
      planningEnd: formatKstIso(now),
    }
  }

  return {
    planningStart: formatKstIso(new Date(Math.min(...timestamps))),
    planningEnd: formatKstIso(new Date(Math.max(...timestamps))),
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

  const delayedOrdersDays = pick(metrics, ['delayed_orders_days', 'delayedOrdersDays'])
  if (delayedOrdersDays !== null) return roundHours(Number(delayedOrdersDays) * 24)

  const p95Minutes = pick(metrics, ['p95_tardiness_minutes', 'p95TardinessMinutes'])
  if (p95Minutes !== null) return roundHours(Number(p95Minutes) / 60)

  return 0
}

function setIfMissing(target = {}, key, value) {
  if (!target || value === null || value === undefined || value === '') return
  if (target[key] === null || target[key] === undefined || target[key] === '') {
    target[key] = value
  }
}

function metricNumber(source = {}, keys = []) {
  return toNumber(pick(source, keys))
}

function hydrateMetricAliases(metrics = {}, planValueAnalysis = {}) {
  if (!metrics) return metrics

  setIfMissing(metrics, 'expected_delay_days', pick(metrics, ['delayed_orders_days', 'delayedOrdersDays']))
  setIfMissing(metrics, 'delayed_orders_days', pick(metrics, ['expected_delay_days', 'expectedDelayDays']))

  const totalTardinessMinutes = metricNumber(metrics, ['total_tardiness_minutes', 'totalTardinessMinutes'])
  if (totalTardinessMinutes !== null) {
    const delayDays = Math.round((totalTardinessMinutes / 1440) * 1000000) / 1000000
    setIfMissing(metrics, 'expected_delay_days', delayDays)
    setIfMissing(metrics, 'delayed_orders_days', delayDays)
  }

  setIfMissing(metrics, 'delay_risk_order_count', pick(metrics, ['expected_delayed_orders', 'expectedDelayedOrders']))
  setIfMissing(metrics, 'expected_delayed_orders', pick(metrics, ['delay_risk_order_count', 'delayRiskOrderCount']))

  const delayFlagOrderCount = pick(planValueAnalysis, ['delay_flag_order_count', 'delayFlagOrderCount'])
  setIfMissing(metrics, 'delay_risk_order_count', delayFlagOrderCount)
  setIfMissing(metrics, 'expected_delayed_orders', delayFlagOrderCount)

  return metrics
}

function syncMetricObjects(primary = {}, secondary = {}) {
  if (!primary || !secondary) return
  const metricFields = [
    'expected_delay_days',
    'delayed_orders_days',
    'total_tardiness_minutes',
    'delay_risk_order_count',
    'expected_delayed_orders',
  ]
  metricFields.forEach((key) => {
    setIfMissing(primary, key, secondary[key])
    setIfMissing(secondary, key, primary[key])
  })
}

function hydrateDeltaAliases(computedDeltas = {}, baselineMetrics = {}, alternativeMetrics = {}) {
  if (!computedDeltas) return computedDeltas

  setIfMissing(computedDeltas, 'expected_delay_days_reduction', pick(computedDeltas, [
    'delayed_orders_days_reduction',
    'delayedOrdersDaysReduction',
  ]))
  setIfMissing(computedDeltas, 'delayed_orders_days_reduction', pick(computedDeltas, [
    'expected_delay_days_reduction',
    'expectedDelayDaysReduction',
  ]))

  const baselineDelayDays = metricNumber(baselineMetrics, ['expected_delay_days', 'expectedDelayDays', 'delayed_orders_days', 'delayedOrdersDays'])
  const alternativeDelayDays = metricNumber(alternativeMetrics, ['expected_delay_days', 'expectedDelayDays', 'delayed_orders_days', 'delayedOrdersDays'])
  if (baselineDelayDays !== null && alternativeDelayDays !== null) {
    const reduction = Math.round((baselineDelayDays - alternativeDelayDays) * 1000000) / 1000000
    setIfMissing(computedDeltas, 'expected_delay_days_reduction', reduction)
    setIfMissing(computedDeltas, 'delayed_orders_days_reduction', reduction)
  }

  return computedDeltas
}

/**
 * 목적: AI 계획/시뮬레이션 응답의 snake_case/camelCase 지표 별칭을 상호 보강한다.
 * 입력: generatePlanAiRecommendation 또는 generateMonthlyPlanAiAnalysis의 원본 응답.
 * 출력: 지연일/지연분/지연 주문 수와 개선량 별칭이 채워진 동일 응답 객체.
 * 처리 흐름:
 * 1. baseline의 current_state_summary와 simulation_metrics를 찾아 지표 별칭을 채운다.
 * 2. baseline 두 지표 객체가 서로 빠진 값을 보완하도록 동기화한다.
 * 3. 각 alternative의 simulation_metrics와 computed_deltas에도 동일한 보정을 적용한다.
 */
function hydrateAiPlanningResponse(response = {}) {
  const simulationResponse = pick(response, ['simulation_response', 'simulationResponse'], {})
  const baseline = pick(simulationResponse, ['baseline'], {})
  const baselineCurrentMetrics = pick(baseline, ['current_state_summary', 'currentStateSummary'], {})
  const baselineSimulationMetrics = pick(baseline, ['simulation_metrics', 'simulationMetrics'], {})
  hydrateMetricAliases(baselineCurrentMetrics)
  hydrateMetricAliases(baselineSimulationMetrics)
  syncMetricObjects(baselineCurrentMetrics, baselineSimulationMetrics)
  const baselineMetrics = Object.keys(baselineCurrentMetrics).length > 0
    ? baselineCurrentMetrics
    : baselineSimulationMetrics

  asArray(pick(simulationResponse, ['alternatives'], [])).forEach((alternative) => {
    const simulationMetrics = pick(alternative, ['simulation_metrics', 'simulationMetrics'], {})
    const computedDeltas = pick(alternative, ['computed_deltas', 'computedDeltas'], {})
    const planValueAnalysis = pick(alternative, ['plan_value_analysis', 'planValueAnalysis'], {})
    hydrateMetricAliases(simulationMetrics, planValueAnalysis)
    hydrateDeltaAliases(computedDeltas, baselineMetrics, simulationMetrics)
  })

  return response
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

/**
 * 목적: AI가 선택한 계획들의 라인 내 순번이 기존 계획과 충돌하지 않도록 재배정한다.
 * 입력: 선택 대안의 계획 배열과 비교 기준이 되는 전체 계획 배열.
 * 출력: planSequence가 충돌 없이 보정된 선택 계획 배열.
 * 처리 흐름:
 * 1. 선택 대상 planId는 기존 순번 점유 목록에서 제외한다.
 * 2. 라인별 사용 중인 순번과 최대 순번을 수집한다.
 * 3. 선택 계획을 라인/시작시각 기준으로 정렬해 원하는 순번을 우선 배정한다.
 * 4. 이미 사용 중이면 라인별 다음 순번을 찾아 planSequence를 채운다.
 */
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

/**
 * 목적: 선택된 AI 대안 내부에 같은 라인 시간 겹침이 있는지 찾는다.
 * 입력: 반영 예정 생산계획 배열.
 * 출력: 겹침 정보 배열(lineId, left/right 계획, 원본 인덱스).
 * 처리 흐름:
 * 1. lineId별로 시작/종료 시각이 유효한 계획을 묶는다.
 * 2. 각 라인 안에서 시작시각 기준으로 정렬한다.
 * 3. 현재 계획 시작이 이전 계획 종료보다 빠르면 겹침으로 기록한다.
 * 4. 더 늦게 끝나는 계획을 기준으로 갱신해 연속 겹침도 탐지한다.
 */
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

function isInternalAiMessage(message = '') {
  return /LLM output contains|not present in evidence|PlanningValidationError|Evaluation draft JSON schema is invalid|Final evaluation JSON schema is invalid|validation error for|Input should be|pydantic\.dev/i.test(String(message))
}

function sanitizeAiText(message, fallback = AI_EVALUATION_FALLBACK_TEXT) {
  if (!message || message === AI_EVALUATION_FALLBACK_TEXT || isInternalAiMessage(message)) return fallback
  return message
}

function getOptionReviewState({ unscheduledPlanIds, calculatedReduction }) {
  if (unscheduledPlanIds.length > 0) {
    return {
      level: 'BLOCKED',
      label: '반영 불가',
      message: getUnscheduledWarningText({ unscheduledPlanIds }),
    }
  }

  if (calculatedReduction < 0) {
    return {
      level: 'NOT_RECOMMENDED',
      label: '반영 비추천',
      message: '기존 계획보다 지연 시간이 증가해 바로 반영을 권장하지 않습니다.',
    }
  }

  if (calculatedReduction === 0) {
    return {
      level: 'CAUTION',
      label: '개선 없음',
      message: '기존 계획 대비 지연 개선이 확인되지 않았습니다.',
    }
  }

  return {
    level: 'RECOMMENDED',
    label: '반영 가능',
    message: '',
  }
}

/**
 * 목적: AI 원본 응답을 추천 대안 카드/상세 화면에서 쓰는 옵션 모델로 변환한다.
 * 입력: 보정된 AI 계획/시뮬레이션 응답.
 * 출력: variantCode, plans, 지연 개선, 추천 등급, 검토 상태를 담은 옵션 배열.
 * 처리 흐름:
 * 1. planning_response의 후보와 simulation_response의 대안을 variantCode로 매칭한다.
 * 2. baseline/alternative 지표에서 전후 지연 시간을 계산한다.
 * 3. computed_deltas가 있으면 지연 개선량으로 쓰고, 없으면 전후 차이를 계산한다.
 * 4. 미배정 계획, 요약/사유 문구, 추천 등급과 비용/가동률 변화를 화면 모델로 묶는다.
 */
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
    const expectedDelayDaysReduction = pick(computedDeltas, [
      'expected_delay_days_reduction',
      'expectedDelayDaysReduction',
      'delayed_orders_days_reduction',
      'delayedOrdersDaysReduction',
    ])
    const calculatedReduction = expectedDelayDaysReduction !== null
      ? roundHours(Number(expectedDelayDaysReduction) * 24)
      : roundHours(beforeDelayHr - afterDelayHr)
    const delayReductionHr = Math.max(calculatedReduction, 0)
    const unscheduledPlanIds = normalizeUnscheduledPlanIds(candidate)
    const reviewState = getOptionReviewState({ unscheduledPlanIds, calculatedReduction })
    const summaryText = sanitizeAiText(
      pick(aiRecommendation, ['summary_text', 'summaryText'], ''),
      ''
    )
    const reasons = asArray(pick(aiRecommendation, ['reasons'], []))
      .map(reason => sanitizeAiText(reason, ''))
      .filter((reason, index, array) => reason && array.indexOf(reason) === index)

    return {
      variantCode,
      variantName: getPlanVariantName(candidate),
      status: pick(candidate, ['status'], '-'),
      plans: asArray(pick(candidate, ['plans'], [])),
      unscheduledPlanIds,
      unscheduledWarningText: getUnscheduledWarningText({ unscheduledPlanIds }),
      reviewState,
      alternative,
      summaryText,
      reasons,
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

function filterSchedulableAiRecommendations(options = []) {
  return options.filter(option => option.unscheduledPlanIds.length === 0)
}

function resolveAiRecommendationDisplayOptions(options = []) {
  const schedulableOptions = filterSchedulableAiRecommendations(options)
  if (schedulableOptions.length > 0) {
    return {
      options: schedulableOptions,
      diagnosticMessage: '',
    }
  }

  const unscheduledIds = [
    ...new Set(
      options
        .flatMap(option => option.unscheduledPlanIds)
        .filter(value => value !== null && value !== undefined)
    ),
  ]
  const preview = unscheduledIds.slice(0, 8).join(', ')
  const suffix = unscheduledIds.length > 8 ? ` 외 ${unscheduledIds.length - 8}건` : ''

  return {
    options,
    diagnosticMessage: options.length === 0
      ? ''
      : `반영 가능한 대안은 없어서 미배정 대안을 진단용으로 표시합니다. 미배정 대상: ${preview}${suffix}`,
  }
}

function serializeScheduleConflict(conflict = {}) {
  if (!conflict) return null

  return {
    planId: conflict.planId ?? null,
    message: conflict.message ?? '',
    originalPlan: conflict.originalPlan ?? null,
    movedPlan: conflict.movedPlan ?? null,
    payload: conflict.payload ?? null,
  }
}

/**
 * 목적: 선택한 AI 대안을 백엔드 저장 API가 요구하는 시뮬레이션 payload로 변환한다.
 * 입력: 선택 옵션, planId 매핑 Map, 전체 계획 배열.
 * 출력: saveSelectedPlanSimulation에 전달할 payload 객체.
 * 처리 흐름:
 * 1. AI plan의 다양한 필드 별칭에서 plan/order/product/line/operator 정보를 해석한다.
 * 2. 날짜는 OffsetDateTime 형식으로 보정하고, 기존 계획의 before 값을 함께 담는다.
 * 3. 선택 계획들의 planSequence를 기존 계획과 충돌하지 않게 재배정한다.
 * 4. 전후 지연 시간, 가동률, 생산량, 비용 변화와 추천 등급을 payload 최상위에 구성한다.
 */
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
    simulationName: option.variantName || 'AI 생산계획 대안',
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

/**
 * 목적: AI 대안 저장 전 필수 매핑과 내부 일정 충돌을 클라이언트에서 먼저 검증한다.
 * 입력: saveSelectedPlanSimulation에 보낼 payload.
 * 출력: 반환값 없음. 검증 실패 시 Error를 throw.
 * 처리 흐름:
 * 1. planId/orderId가 매핑되지 않은 계획을 최대 5개까지 수집한다.
 * 2. 누락 매핑이 있으면 사용자가 확인할 수 있는 오류 메시지를 만든다.
 * 3. 같은 라인 내 시간 겹침을 탐지하고, 첫 겹침을 오류로 보고한다.
 */
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
    `AI 대안 내부에 같은 라인 일정 겹침이 있습니다. 라인 ${first.lineId}: `
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
  const aiRecommendationReviewOpen = ref(false)
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
  /**
   * 목적: 캘린더에 표시할 생산계획 목록을 필터/기간 조건으로 조회한다.
   * 입력: 선택적 기간 조건(startAt/endAt 등).
   * 출력: 반환값 없음. calendarPlans, loading/error 상태를 갱신한다.
   * 처리 흐름:
   * 1. 로딩 상태를 켜고 기존 오류를 비운다.
   * 2. 현재 필터와 전달받은 range를 합쳐 fetchAllPlans를 호출한다.
   * 3. 성공 시 응답 data를 calendarPlans에 저장하고, 실패 시 목록을 비운다.
   */
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
  /**
   * 목적: 선택한 생산계획의 상세 정보를 조회해 상세 패널 상태를 채운다.
   * 입력: 조회할 planId.
   * 출력: 반환값 없음. selectedPlan, detailLoading/detailError를 갱신한다.
   * 처리 흐름:
   * 1. 상세 로딩을 시작하고 기존 오류를 초기화한다.
   * 2. fetchPlanDetail로 상세 데이터를 조회한다.
   * 3. 성공 시 selectedPlan에 저장하고, 실패 시 선택 상태를 해제한다.
   */
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

  /**
   * 목적: 상세 패널의 수정 폼 값을 백엔드에 저장하고 관련 화면 상태를 새로고침한다.
   * 입력: editForm 상태와 현재 selectedPlan.
   * 출력: 반환값 없음. 성공/실패 상태와 상세/캘린더/수정이력을 갱신한다.
   * 처리 흐름:
   * 1. 선택된 계획이 없으면 중단하고, 수정 로딩/오류 상태를 초기화한다.
   * 2. editForm 값을 API payload로 변환해 updatePlan을 호출한다.
   * 3. 성공하면 편집 모드를 종료하고 상세, 캘린더, 수정 이력을 병렬 재조회한다.
   * 4. 실패하면 validationErrors와 사용자 메시지를 상태에 저장한다.
   */
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

  /**
   * 목적: 캘린더 드래그로 이동한 생산계획을 서버에 저장하고 충돌 시 AI 분석 payload를 만든다.
   * 입력: planId, 이동 일수(deltaDays), FullCalendar revert 콜백.
   * 출력: 반환값 없음. 캘린더 초안, 저장 오류, 충돌 상태를 갱신한다.
   * 처리 흐름:
   * 1. 편집 모드가 아니거나 이동 불가 상태면 FullCalendar 변경을 되돌린다.
   * 2. 초안 계획의 시작/종료 시각을 deltaDays만큼 이동해 optimistic 상태를 만든다.
   * 3. movePlanSchedule API 저장 성공 시 최신 계획과 선택 상세를 다시 불러온다.
   * 4. 409-601 충돌이면 AI 분석에 필요한 원본/이동 계획과 기간 payload를 보관한다.
   */
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
        const planningWindow = getPlanningWindow(plan, movedPlan)
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
    aiRecommendationReviewOpen.value = false
    aiRecommendationLoading.value = false
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''
    applyingAiRecommendation.value = false
  }

  function selectAiRecommendation(variantCode) {
    selectedAiVariantCode.value = variantCode
    updateAiSimulationSession({ selectedVariantCode: variantCode })
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

  /**
   * 목적: 일정 이동 충돌을 해결할 AI 생산계획 대안을 생성한다.
   * 입력: scheduleConflict.payload에 저장된 충돌 계획/기간 정보.
   * 출력: 성공 여부 boolean. 추천 옵션과 선택 variant, 세션 저장 상태를 갱신한다.
   * 처리 흐름:
   * 1. 충돌 payload가 없으면 중단하고, AI 로딩/오류/선택 상태를 초기화한다.
   * 2. generatePlanAiRecommendation API를 호출한 뒤 응답 지표 별칭을 보정한다.
   * 3. AI 응답을 화면 옵션으로 정규화하고 반영 가능한 옵션을 우선 선택한다.
   * 4. 상세 화면 복원용으로 원본 응답, 옵션, 충돌 정보, 선택 variant를 세션에 저장한다.
   */
  async function generateScheduleAiRecommendation() {
    const conflict = scheduleConflict.value
    if (!conflict?.payload) return

    aiRecommendationLoading.value = true
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''

    try {
      const response = hydrateAiPlanningResponse(await generatePlanAiRecommendation(conflict.payload))
      const { options, diagnosticMessage } = resolveAiRecommendationDisplayOptions(
        normalizeAiRecommendations(response)
      )
      if (options.length === 0) {
        throw new Error('AI 대안이 없습니다.')
      }

      aiRecommendationOptions.value = options
      selectedAiVariantCode.value = (
        options.find(option => option.unscheduledPlanIds.length === 0) ?? options[0]
      ).variantCode
      saveAiSimulationSession({
        response,
        options,
        conflict: serializeScheduleConflict(conflict),
        selectedVariantCode: selectedAiVariantCode.value,
        diagnosticMessage,
      })
      return true
    } catch (e) {
      aiRecommendationError.value = e.message ?? 'AI 대안을 생성하지 못했습니다.'
      return false
    } finally {
      aiRecommendationLoading.value = false
    }
  }

  /**
   * 목적: 월간 조건 기반 AI 생산계획 분석을 실행하고 추천 옵션을 준비한다.
   * 입력: 월간 분석 API payload.
   * 출력: 성공 여부 boolean. 추천 옵션과 세션 저장 상태를 갱신한다.
   * 처리 흐름:
   * 1. 기존 충돌/추천 상태를 초기화하고 AI 로딩을 시작한다.
   * 2. generateMonthlyPlanAiAnalysis API 응답을 받아 지표 별칭을 보정한다.
   * 3. 응답을 추천 옵션으로 정규화하고 기본 선택 variant를 정한다.
   * 4. AI 상세/결과 화면에서 이어볼 수 있도록 세션에 저장한다.
   */
  async function generateMonthlyAiRecommendation(payload) {
    clearAiSimulationSession()
    aiRecommendationLoading.value = true
    aiRecommendationError.value = null
    aiRecommendationOptions.value = []
    selectedAiVariantCode.value = ''
    scheduleConflict.value = null
    aiRecommendationReviewOpen.value = false

    try {
      const response = hydrateAiPlanningResponse(await generateMonthlyPlanAiAnalysis(payload))
      const { options, diagnosticMessage } = resolveAiRecommendationDisplayOptions(
        normalizeAiRecommendations(response)
      )
      if (options.length === 0) {
        throw new Error('AI 대안이 없습니다.')
      }

      aiRecommendationOptions.value = options
      selectedAiVariantCode.value = (
        options.find(option => option.unscheduledPlanIds.length === 0) ?? options[0]
      ).variantCode
      saveAiSimulationSession({
        response,
        options,
        conflict: null,
        selectedVariantCode: selectedAiVariantCode.value,
        diagnosticMessage,
      })
      return true
    } catch (e) {
      aiRecommendationError.value = e.message ?? '월간 AI 분석을 생성하지 못했습니다.'
      return false
    } finally {
      aiRecommendationLoading.value = false
    }
  }

  /**
   * 목적: AI 상세/결과 화면에서 돌아왔을 때 저장된 추천 옵션을 스토어 상태로 복원한다.
   * 입력: 선택적으로 강제 선택할 variantCode.
   * 출력: 복원 성공 여부 boolean.
   * 처리 흐름:
   * 1. 세션 저장소에서 AI 추천 세션을 읽고 옵션이 없으면 실패를 반환한다.
   * 2. 추천 옵션, 선택 variant, 로딩/오류 상태를 화면 표시 상태로 되돌린다.
   * 3. 세션에 충돌 payload가 있으면 scheduleConflict도 함께 복원한다.
   */
  function restoreAiRecommendationFromSession(variantCode = '') {
    const session = loadAiSimulationSession()
    if (!session.options.length) return false

    aiRecommendationOptions.value = session.options
    selectedAiVariantCode.value = variantCode || session.selectedVariantCode || session.options[0]?.variantCode || ''
    aiRecommendationError.value = null
    aiRecommendationLoading.value = false
    applyingAiRecommendation.value = false
    aiRecommendationReviewOpen.value = true

    if (session.conflict?.payload) {
      scheduleConflict.value = {
        ...session.conflict,
        message: session.conflict.message || 'AI 대안 상세를 확인한 뒤 선택한 대안을 반영할 수 있습니다.',
      }
    }

    return true
  }

  /**
   * 목적: 사용자가 선택한 AI 대안을 서버에 저장해 실제 생산계획에 반영한다.
   * 입력: selectedAiRecommendation과 현재 충돌/캘린더 상태.
   * 출력: 반환값 없음. 성공 시 캘린더를 갱신하고 AI 충돌 상태를 닫는다.
   * 처리 흐름:
   * 1. 선택 옵션이 없거나 이미 반영 중이면 중단한다.
   * 2. 미배정 또는 비추천 대안은 서버 호출 전에 사용자 오류로 막는다.
   * 3. 최신 계획 목록을 조회해 AI 계획과 기존 계획의 planId/orderId를 매핑한다.
   * 4. 저장 payload를 만들고 내부 검증을 통과하면 saveSelectedPlanSimulation을 호출한다.
   * 5. 성공 시 캘린더를 재조회하고 초안/충돌/AI 상태를 정리한다.
   */
  async function applySelectedAiRecommendation() {
    const option = selectedAiRecommendation.value
    const conflict = scheduleConflict.value
    if (!option || applyingAiRecommendation.value) return

    if (option.unscheduledPlanIds?.length > 0) {
      aiRecommendationError.value = option.unscheduledWarningText
        || '미배정 생산계획이 있는 대안은 바로 반영할 수 없습니다.'
      return
    }

    if (option.reviewState?.level === 'NOT_RECOMMENDED') {
      aiRecommendationError.value = option.reviewState.message
        || '기존 계획보다 지연 시간이 증가해 바로 반영할 수 없습니다.'
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
      aiRecommendationError.value = e.message ?? 'AI 대안 반영에 실패했습니다.'
    } finally {
      applyingAiRecommendation.value = false
    }
  }

  return {
    // calendar
    calendarPlans, visibleCalendarPlans, calendarPreviewPlans, calendarLoading, calendarError,
    calendarEditing, calendarSaving, calendarSaveError, scheduleConflict,
    aiRecommendationReviewOpen,
    aiRecommendationLoading, aiRecommendationError, aiRecommendationOptions,
    selectedAiVariantCode, selectedAiRecommendation, applyingAiRecommendation,
    filters,
    loadCalendarPlans, applyFilters,
    enterCalendarEditMode, movePlan, previewPlanMove, clearPlanMovePreview, completeCalendarEdit,
    closeScheduleConflict, generateScheduleAiRecommendation, generateMonthlyAiRecommendation,
    selectAiRecommendation, applySelectedAiRecommendation,
    restoreAiRecommendationFromSession,
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
