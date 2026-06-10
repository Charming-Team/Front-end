import { getToken } from '../../utils/storage.js'
import { apiRequest } from '../../utils/api.js'
import { MOCK_PLANS, MOCK_LINES, MOCK_UPDATE_HISTORY, NON_EDITABLE_STATUSES } from './mock.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))

const LINE_NAME_BY_ID = {
  1: 'ABS 주 생산 Line',
  2: 'ABS 보조 생산 Line',
  3: 'PP 범용 생산 Line',
  4: 'PP 기능성 생산 Line',
  5: 'PE 범용 생산 Line',
  6: 'PE 특화 생산 Line',
}

function getLineName(plan) {
  return plan.lineName || LINE_NAME_BY_ID[Number(plan.lineId)] || `라인 #${plan.lineId ?? '-'}`
}

function getProductName(plan, context = {}) {
  const order = context.ordersById?.get(String(plan.orderId))
  const product = context.productsById?.get(String(plan.productId))
  return (
    plan.productName ||
    order?.productName ||
    product?.productName ||
    plan.productCode ||
    order?.productCode ||
    product?.productCode ||
    `제품 #${plan.productId ?? '-'}`
  )
}

function getOperatorName(plan, context = {}) {
  const order = context.ordersById?.get(String(plan.orderId))
  if (plan.operatorName) return plan.operatorName
  if (order?.operatorNames) return order.operatorNames
  if (plan.operatorId == null) return '미배정'
  return `담당자 #${plan.operatorId}`
}

function toEstimatedDurationMin(value) {
  if (value === null || value === undefined || value === '') return null
  const hours = Number(value)
  return Number.isFinite(hours) ? Math.round(hours * 60) : null
}

function normalizePlan(plan = {}, context = {}) {
  return {
    ...plan,
    planId: Number(plan.planId),
    orderId: plan.orderId,
    productId: plan.productId,
    productName: getProductName(plan, context),
    lineId: plan.lineId,
    lineName: plan.lineName || context.linesById?.get(String(plan.lineId))?.lineName || getLineName(plan),
    operatorId: plan.operatorId,
    operatorName: getOperatorName(plan, context),
    plannedStartAt: plan.plannedStartAt,
    plannedEndAt: plan.plannedEndAt,
    estimatedDurationMin: plan.estimatedDurationMin ?? toEstimatedDurationMin(plan.estimatedDurationHr),
    plannedQuantity: Number(plan.plannedQuantity ?? 0),
    planSequence: Number(plan.planSequence ?? 0),
    planStatus: plan.planStatus || 'SCHEDULED',
    createdAt: plan.createdAt ?? null,
    updatedAt: plan.updatedAt ?? null,
    materials: plan.materials ?? [],
  }
}

function buildPlanQuery({ status = '', search = '', startAt = '', endAt = '', page = null, size = null } = {}) {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (search?.trim()) params.set('search', search.trim())
  if (startAt) params.set('startAt', startAt)
  if (endAt) params.set('endAt', endAt)
  if (page !== null && page !== undefined) params.set('page', String(page))
  if (size !== null && size !== undefined) params.set('size', String(size))

  const query = params.toString()
  return `/api/plans${query ? `?${query}` : ''}`
}

function getPlanContent(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.content)) return response.content
  return []
}

function createOrderContext(orders = []) {
  const ordersById = new Map()
  const productsById = new Map()

  orders.forEach((order) => {
    if (order?.orderId != null) ordersById.set(String(order.orderId), order)
    if (order?.productId != null) productsById.set(String(order.productId), order)
  })

  return { ordersById, productsById }
}

async function fetchOrderContext() {
  try {
    const response = await apiRequest('/api/orders?page=0&size=1000')
    const orders = Array.isArray(response?.content) ? response.content : []
    return createOrderContext(orders)
  } catch {
    return createOrderContext()
  }
}

async function fetchOrderDetailContext(orderId) {
  if (orderId == null) return createOrderContext()

  try {
    const order = await apiRequest(`/api/orders/${encodeURIComponent(orderId)}`)
    return createOrderContext([order])
  } catch {
    return createOrderContext()
  }
}

function matchesPlanFilters(plan, { status = '', search = '' } = {}) {
  if (status && plan.planStatus !== status) return false

  const query = search.trim().toLowerCase()
  if (!query) return true

  return (
    String(plan.planId).includes(query) ||
    String(plan.orderId ?? '').includes(query) ||
    plan.productName.toLowerCase().includes(query) ||
    plan.lineName.toLowerCase().includes(query) ||
    plan.operatorName.toLowerCase().includes(query)
  )
}

function validatePlanPayload(payload) {
  const errors = {}
  if (!payload.plannedStartAt) errors.plannedStartAt = '계획 시작일시를 입력하세요.'
  if (!payload.plannedEndAt)   errors.plannedEndAt   = '계획 종료일시를 입력하세요.'
  if (payload.plannedStartAt && payload.plannedEndAt) {
    if (new Date(payload.plannedEndAt) <= new Date(payload.plannedStartAt))
      errors.plannedEndAt = '종료일시는 시작일시보다 늦어야 합니다.'
  }
  if (!payload.lineId)                                      errors.lineId          = '라인을 선택하세요.'
  if (!payload.planSequence || payload.planSequence < 1)    errors.planSequence    = '순서는 1 이상이어야 합니다.'
  if (!payload.plannedQuantity || payload.plannedQuantity < 1) errors.plannedQuantity = '계획 수량은 1 이상이어야 합니다.'
  return errors
}

function throwIfInvalidPayload(payload) {
  const errors = validatePlanPayload(payload)
  if (Object.keys(errors).length === 0) return

  const err = new Error('입력값을 확인해주세요.')
  err.status = 422
  err.validationErrors = errors
  throw err
}

function throwIfPlanLocked(plan) {
  if (!NON_EDITABLE_STATUSES.includes(plan.planStatus)) return

  const err = new Error(`${plan.planStatus} 상태의 계획은 수정할 수 없습니다.`)
  err.status = 422
  throw err
}

function hasScheduleOverlap(plans, planId, lineId, plannedStartAt, plannedEndAt) {
  const newStart = new Date(plannedStartAt)
  const newEnd = new Date(plannedEndAt)
  return plans.some(p =>
    p.planId !== planId &&
    p.lineId === lineId &&
    !NON_EDITABLE_STATUSES.includes(p.planStatus) &&
    new Date(p.plannedStartAt) < newEnd &&
    new Date(p.plannedEndAt) > newStart
  )
}

function getChangedFields(plan, payload, lineId) {
  const changedFields = []
  if (payload.plannedStartAt !== plan.plannedStartAt)
    changedFields.push({ field: 'plannedStartAt', label: '계획 시작', before: plan.plannedStartAt, after: payload.plannedStartAt })
  if (payload.plannedEndAt !== plan.plannedEndAt)
    changedFields.push({ field: 'plannedEndAt', label: '계획 종료', before: plan.plannedEndAt, after: payload.plannedEndAt })
  if (lineId !== plan.lineId)
    changedFields.push({ field: 'lineId', label: '라인', before: plan.lineName, after: MOCK_LINES.find(l => l.lineId === lineId)?.lineName })
  if (Number(payload.planSequence) !== plan.planSequence)
    changedFields.push({ field: 'planSequence', label: '라인 내 순서', before: plan.planSequence, after: Number(payload.planSequence) })
  if (Number(payload.plannedQuantity) !== plan.plannedQuantity)
    changedFields.push({ field: 'plannedQuantity', label: '계획 수량', before: plan.plannedQuantity, after: Number(payload.plannedQuantity) })
  return changedFields
}

function getRecalculationRequired(plan, payload, lineId) {
  return (
    payload.plannedStartAt !== plan.plannedStartAt ||
    payload.plannedEndAt !== plan.plannedEndAt ||
    lineId !== plan.lineId ||
    Number(payload.plannedQuantity) !== plan.plannedQuantity
  )
}

function recordUpdateHistory(planId, changedFields, recalculationRequired) {
  MOCK_UPDATE_HISTORY.push({
    historyId: MOCK_UPDATE_HISTORY.length + 1,
    planId,
    updatedAt: new Date().toISOString(),
    updatedBy: '담당자',
    changedFields,
    recalculationRequired,
  })
}

function applyPlanPayload(plan, payload, lineId, recalculationRequired) {
  const selectedLine = MOCK_LINES.find(l => l.lineId === lineId)
  return {
    ...plan,
    lineId,
    lineName: selectedLine?.lineName ?? plan.lineName,
    planSequence: Number(payload.planSequence),
    plannedStartAt: payload.plannedStartAt,
    plannedEndAt: payload.plannedEndAt,
    plannedQuantity: Number(payload.plannedQuantity),
    estimatedDurationMin: recalculationRequired ? null : plan.estimatedDurationMin,
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchPlanList({ status = '', search = '', page = 1, pageSize = 15 } = {}) {
  const [plans, orderContext] = await Promise.all([
    apiRequest(buildPlanQuery({ status, search, page: 0, size: 1000 })),
    fetchOrderContext(),
  ])
  const filtered = getPlanContent(plans)
    .map(plan => normalizePlan(plan, orderContext))
    .filter(plan => matchesPlanFilters(plan, { status, search }))

  const total = filtered.length
  const data = filtered.slice((page - 1) * pageSize, page * pageSize)
  return { data, total, page, pageSize }
}

export async function fetchAllPlans({ status = '', search = '', startAt = '', endAt = '' } = {}) {
  const [plans, orderContext] = await Promise.all([
    apiRequest(buildPlanQuery({ status, search, startAt, endAt, page: 0, size: 1000 })),
    fetchOrderContext(),
  ])
  const data = getPlanContent(plans)
    .map(plan => normalizePlan(plan, orderContext))
    .filter(plan => matchesPlanFilters(plan, { status, search }))

  return { data, total: data.length }
}

export async function fetchPlanDetail(planId) {
  const plan = await apiRequest(`/api/plans/${encodeURIComponent(planId)}`)
  const orderContext = await fetchOrderDetailContext(plan?.orderId)
  return normalizePlan(plan, orderContext)
}

export async function fetchLines() {
  const response = await apiRequest('/api/lines/operation-statuses?page=0&size=100')
  const content = Array.isArray(response?.content) ? response.content : []

  if (content.length === 0) {
    return MOCK_LINES.map(line => ({ ...line }))
  }

  return content.map(line => ({
    lineId: line.lineId,
    lineName: line.lineName || LINE_NAME_BY_ID[Number(line.lineId)] || `라인 #${line.lineId ?? '-'}`,
  }))
}

export async function updatePlan(planId, payload) {
  return apiRequest(`/api/plans/${encodeURIComponent(planId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function movePlanSchedule(planId, payload) {
  return apiRequest(`/api/plans/${encodeURIComponent(planId)}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function generatePlanAiRecommendation(payload) {
  return apiRequest('/api/plans/ai/generate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function saveSelectedPlanSimulation(payload) {
  return apiRequest('/api/plans/simulations/selected', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updatePlans(updates) {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }

  await sleep(300)

  const stagedPlans = MOCK_PLANS.map(plan => ({ ...plan }))
  const preparedUpdates = updates.map(({ planId, ...payload }) => {
    const stagedIndex = stagedPlans.findIndex(plan => plan.planId === planId)
    if (stagedIndex === -1) {
      const err = new Error('생산계획을 찾을 수 없습니다.')
      err.status = 404
      throw err
    }

    const plan = stagedPlans[stagedIndex]
    throwIfPlanLocked(plan)
    throwIfInvalidPayload(payload)

    const lineId = Number(payload.lineId)
    const recalculationRequired = getRecalculationRequired(plan, payload, lineId)
    const changedFields = getChangedFields(plan, payload, lineId)
    stagedPlans[stagedIndex] = applyPlanPayload(plan, payload, lineId, recalculationRequired)

    return { planId, changedFields, recalculationRequired }
  })

  const hasOverlap = stagedPlans.some((plan, index) =>
    !NON_EDITABLE_STATUSES.includes(plan.planStatus) &&
    stagedPlans.some((nextPlan, nextIndex) =>
      index !== nextIndex &&
      plan.lineId === nextPlan.lineId &&
      !NON_EDITABLE_STATUSES.includes(nextPlan.planStatus) &&
      new Date(plan.plannedStartAt) < new Date(nextPlan.plannedEndAt) &&
      new Date(plan.plannedEndAt) > new Date(nextPlan.plannedStartAt)
    )
  )
  if (hasOverlap) {
    const err = new Error('선택한 라인의 해당 시간대에 이미 다른 계획이 존재합니다.')
    err.status = 409
    throw err
  }

  preparedUpdates.forEach(({ planId, changedFields, recalculationRequired }) => {
    recordUpdateHistory(planId, changedFields, recalculationRequired)
  })

  stagedPlans.forEach(stagedPlan => {
    const index = MOCK_PLANS.findIndex(plan => plan.planId === stagedPlan.planId)
    MOCK_PLANS[index] = stagedPlan
  })

  return { plans: preparedUpdates.map(({ planId }) => ({ ...MOCK_PLANS.find(plan => plan.planId === planId) })) }
}

export async function fetchPlanUpdateHistory(planId) {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }
  await sleep(150)
  return MOCK_UPDATE_HISTORY.filter(h => h.planId === planId).reverse()
}
