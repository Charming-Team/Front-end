import { getToken } from '../../utils/storage.js'
import { MOCK_PLANS, MOCK_LINES, MOCK_UPDATE_HISTORY, NON_EDITABLE_STATUSES } from './mock.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))

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
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }

  await sleep(400)

  const q = search.trim().toLowerCase()
  const filtered = MOCK_PLANS.filter(p => {
    if (status && p.planStatus !== status) return false
    if (q) {
      return (
        String(p.planId).includes(q) ||
        String(p.orderId).includes(q) ||
        p.productName.includes(q) ||
        p.lineName.toLowerCase().includes(q) ||
        p.operatorName.includes(q)
      )
    }
    return true
  })

  const total = filtered.length
  const data = filtered.slice((page - 1) * pageSize, page * pageSize)
  return { data, total, page, pageSize }
}

export async function fetchAllPlans({ status = '', search = '' } = {}) {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }

  await sleep(400)

  const q = search.trim().toLowerCase()
  const data = MOCK_PLANS.filter(p => {
    if (status && p.planStatus !== status) return false
    if (q) {
      return (
        String(p.planId).includes(q) ||
        String(p.orderId).includes(q) ||
        p.productName.includes(q) ||
        p.lineName.toLowerCase().includes(q) ||
        p.operatorName.includes(q)
      )
    }
    return true
  })

  return { data, total: data.length }
}

export async function fetchPlanDetail(planId) {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }

  await sleep(200)

  const plan = MOCK_PLANS.find(p => p.planId === planId)
  if (!plan) {
    const err = new Error('생산계획을 찾을 수 없습니다.')
    err.status = 404
    throw err
  }

  return { ...plan }
}

export async function fetchLines() {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }
  await sleep(100)
  return MOCK_LINES.map(l => ({ ...l }))
}

export async function updatePlan(planId, payload) {
  if (!getToken()) {
    const err = new Error('인증이 필요합니다.')
    err.status = 401
    throw err
  }

  await sleep(300)

  const idx = MOCK_PLANS.findIndex(p => p.planId === planId)
  if (idx === -1) {
    const err = new Error('생산계획을 찾을 수 없습니다.')
    err.status = 404
    throw err
  }

  const plan = MOCK_PLANS[idx]

  throwIfPlanLocked(plan)

  throwIfInvalidPayload(payload)

  // Schedule overlap check (same line, overlapping window, excluding self and final-state plans)
  const lineId   = Number(payload.lineId)
  const hasOverlap = hasScheduleOverlap(MOCK_PLANS, planId, lineId, payload.plannedStartAt, payload.plannedEndAt)
  if (hasOverlap) {
    const err = new Error('선택한 라인의 해당 시간대에 이미 다른 계획이 존재합니다.')
    err.status = 409
    throw err
  }

  // Determine whether recalculation is required
  const recalculationRequired = getRecalculationRequired(plan, payload, lineId)

  // Build audit diff
  const changedFields = getChangedFields(plan, payload, lineId)

  recordUpdateHistory(planId, changedFields, recalculationRequired)

  // Apply update
  MOCK_PLANS[idx] = applyPlanPayload(plan, payload, lineId, recalculationRequired)

  return { plan: { ...MOCK_PLANS[idx] } }
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
