const STORAGE_KEY = 'smap.aiSimulationSession'

function pick(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return fallback
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function asArray(value) {
  return Array.isArray(value) ? value : []
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

  const baselineDelayDays = metricNumber(baselineMetrics, [
    'expected_delay_days',
    'expectedDelayDays',
    'delayed_orders_days',
    'delayedOrdersDays',
  ])
  const alternativeDelayDays = metricNumber(alternativeMetrics, [
    'expected_delay_days',
    'expectedDelayDays',
    'delayed_orders_days',
    'delayedOrdersDays',
  ])
  if (baselineDelayDays !== null && alternativeDelayDays !== null) {
    const reduction = Math.round((baselineDelayDays - alternativeDelayDays) * 1000000) / 1000000
    setIfMissing(computedDeltas, 'expected_delay_days_reduction', reduction)
    setIfMissing(computedDeltas, 'delayed_orders_days_reduction', reduction)
  }

  return computedDeltas
}

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

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function normalizeSession(value = {}) {
  return {
    response: value.response ? hydrateAiPlanningResponse(value.response) : null,
    options: Array.isArray(value.options) ? value.options : [],
    conflict: value.conflict ?? null,
    selectedVariantCode: value.selectedVariantCode ?? '',
    diagnosticMessage: value.diagnosticMessage ?? '',
    savedAt: value.savedAt ?? null,
  }
}

export function saveAiSimulationSession(payload = {}) {
  const storage = getStorage()
  if (!storage) return

  const session = normalizeSession({
    ...payload,
    savedAt: new Date().toISOString(),
  })

  storage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function updateAiSimulationSession(patch = {}) {
  const previous = loadAiSimulationSession()
  saveAiSimulationSession({
    ...previous,
    ...patch,
  })
}

export function loadAiSimulationSession() {
  const storage = getStorage()
  if (!storage) return normalizeSession()

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return normalizeSession()
    return normalizeSession(JSON.parse(raw))
  } catch {
    return normalizeSession()
  }
}

export function clearAiSimulationSession() {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(STORAGE_KEY)
}
