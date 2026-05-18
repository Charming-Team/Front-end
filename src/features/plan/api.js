import { getToken } from '../../utils/storage.js'

const sleep = ms => new Promise(r => setTimeout(r, ms))

// Fields: plan table columns + display names resolved from FK joins (product, line, user)
// Dates use 2026-05 to be visible in the current calendar week
const MOCK_PLANS = [
  {
    planId: 1,
    orderId: 1,
    productId: 101,
    productName: '자동차 브레이크 패드',
    lineId: 1,
    lineName: 'LINE-A',
    operatorId: 11,
    operatorName: '김도현',
    plannedStartAt: '2026-05-05T08:00:00+09:00',
    plannedEndAt:   '2026-05-08T18:00:00+09:00',
    estimatedDurationMin: 3480,
    plannedQuantity: 1000,
    planSequence: 1,
    planStatus: 'IN_PROGRESS',
    createdAt:  '2026-04-28T10:00:00+09:00',
    updatedAt:  '2026-05-05T08:00:00+09:00',
  },
  {
    planId: 2,
    orderId: 2,
    productId: 102,
    productName: '전동 모터 케이싱',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 12,
    operatorName: '이수진',
    plannedStartAt: '2026-05-12T07:00:00+09:00',
    plannedEndAt:   '2026-05-15T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 500,
    planSequence: 2,
    planStatus: 'DELAYED',
    createdAt:  '2026-05-01T09:00:00+09:00',
    updatedAt:  '2026-05-01T09:00:00+09:00',
  },
  {
    planId: 3,
    orderId: 3,
    productId: 103,
    productName: '산업용 베어링',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 13,
    operatorName: '박민준',
    plannedStartAt: '2026-05-18T08:00:00+09:00',
    plannedEndAt:   '2026-05-21T18:00:00+09:00',
    estimatedDurationMin: 4920,
    plannedQuantity: 2000,
    planSequence: 1,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-03T11:00:00+09:00',
    updatedAt:  '2026-05-03T11:00:00+09:00',
  },
  {
    planId: 4,
    orderId: 4,
    productId: 104,
    productName: '유압 실린더',
    lineId: 1,
    lineName: 'LINE-A',
    operatorId: 14,
    operatorName: '최지현',
    plannedStartAt: '2026-05-12T08:00:00+09:00',
    plannedEndAt:   '2026-05-15T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 300,
    planSequence: 2,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-04T14:00:00+09:00',
    updatedAt:  '2026-05-04T14:00:00+09:00',
  },
  {
    planId: 5,
    orderId: 5,
    productId: 105,
    productName: '기어박스 하우징',
    lineId: 4,
    lineName: 'LINE-D',
    operatorId: 15,
    operatorName: '한상호',
    plannedStartAt: '2026-05-19T09:00:00+09:00',
    plannedEndAt:   '2026-05-22T17:00:00+09:00',
    estimatedDurationMin: 4800,
    plannedQuantity: 800,
    planSequence: 1,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-05T09:00:00+09:00',
    updatedAt:  '2026-05-05T09:00:00+09:00',
  },
  {
    planId: 6,
    orderId: 6,
    productId: 106,
    productName: '변속기 부품',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 16,
    operatorName: '정은영',
    plannedStartAt: '2026-05-04T08:00:00+09:00',
    plannedEndAt:   '2026-05-09T18:00:00+09:00',
    estimatedDurationMin: 3480,
    plannedQuantity: 1500,
    planSequence: 1,
    planStatus: 'IN_PROGRESS',
    createdAt:  '2026-04-27T08:00:00+09:00',
    updatedAt:  '2026-05-04T08:00:00+09:00',
  },
  {
    planId: 7,
    orderId: 7,
    productId: 107,
    productName: '서스펜션 암',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 17,
    operatorName: '강민호',
    plannedStartAt: '2026-05-25T08:00:00+09:00',
    plannedEndAt:   '2026-05-27T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 600,
    planSequence: 2,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-06T10:00:00+09:00',
    updatedAt:  '2026-05-06T10:00:00+09:00',
  },
  {
    planId: 8,
    orderId: 8,
    productId: 108,
    productName: '엔진 마운트',
    lineId: 1,
    lineName: 'LINE-A',
    operatorId: 18,
    operatorName: '윤서연',
    plannedStartAt: '2026-04-28T08:00:00+09:00',
    plannedEndAt:   '2026-05-02T18:00:00+09:00',
    estimatedDurationMin: 4920,
    plannedQuantity: 1200,
    planSequence: 3,
    planStatus: 'COMPLETED',
    createdAt:  '2026-04-21T09:00:00+09:00',
    updatedAt:  '2026-05-02T18:00:00+09:00',
  },
  {
    planId: 9,
    orderId: 9,
    productId: 109,
    productName: '터보차저',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 19,
    operatorName: '임성준',
    plannedStartAt: '2026-04-20T08:00:00+09:00',
    plannedEndAt:   '2026-04-24T18:00:00+09:00',
    estimatedDurationMin: 6360,
    plannedQuantity: 200,
    planSequence: 3,
    planStatus: 'COMPLETED',
    createdAt:  '2026-04-13T08:00:00+09:00',
    updatedAt:  '2026-04-24T18:00:00+09:00',
  },
  {
    planId: 10,
    orderId: 10,
    productId: 110,
    productName: '조향 시스템',
    lineId: 4,
    lineName: 'LINE-D',
    operatorId: 20,
    operatorName: '오지현',
    plannedStartAt: '2026-05-06T13:00:00+09:00',
    plannedEndAt:   '2026-05-11T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 900,
    planSequence: 2,
    planStatus: 'DELAYED',
    createdAt:  '2026-04-29T13:00:00+09:00',
    updatedAt:  '2026-05-06T13:00:00+09:00',
  },
  {
    planId: 11,
    orderId: 11,
    productId: 111,
    productName: '배기 매니폴드',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 21,
    operatorName: '배성훈',
    plannedStartAt: '2026-05-28T08:00:00+09:00',
    plannedEndAt:   '2026-06-01T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 400,
    planSequence: 3,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-07T11:00:00+09:00',
    updatedAt:  '2026-05-07T11:00:00+09:00',
  },
  {
    planId: 12,
    orderId: 12,
    productId: 112,
    productName: '클러치 어셈블리',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 22,
    operatorName: '신미래',
    plannedStartAt: '2026-05-19T08:00:00+09:00',
    plannedEndAt:   '2026-05-23T17:00:00+09:00',
    estimatedDurationMin: 6240,
    plannedQuantity: 750,
    planSequence: 4,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-07T09:00:00+09:00',
    updatedAt:  '2026-05-07T09:00:00+09:00',
  },
  // LINE-C: current week fill-in
  {
    planId: 13,
    orderId: 13,
    productId: 113,
    productName: '제어 밸브',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 13,
    operatorName: '박민준',
    plannedStartAt: '2026-05-06T08:00:00+09:00',
    plannedEndAt:   '2026-05-09T17:00:00+09:00',
    estimatedDurationMin: 2700,
    plannedQuantity: 350,
    planSequence: 1,
    planStatus: 'IN_PROGRESS',
    createdAt:  '2026-05-02T09:00:00+09:00',
    updatedAt:  '2026-05-06T08:00:00+09:00',
  },
  // LINE-E plans
  {
    planId: 14,
    orderId: 14,
    productId: 114,
    productName: '냉각 펌프',
    lineId: 5,
    lineName: 'LINE-E',
    operatorId: 23,
    operatorName: '조현우',
    plannedStartAt: '2026-04-28T08:00:00+09:00',
    plannedEndAt:   '2026-05-02T18:00:00+09:00',
    estimatedDurationMin: 5760,
    plannedQuantity: 420,
    planSequence: 1,
    planStatus: 'COMPLETED',
    createdAt:  '2026-04-20T10:00:00+09:00',
    updatedAt:  '2026-05-02T18:00:00+09:00',
  },
  {
    planId: 15,
    orderId: 15,
    productId: 115,
    productName: '연료 인젝터',
    lineId: 5,
    lineName: 'LINE-E',
    operatorId: 23,
    operatorName: '조현우',
    plannedStartAt: '2026-05-05T09:00:00+09:00',
    plannedEndAt:   '2026-05-09T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 680,
    planSequence: 2,
    planStatus: 'IN_PROGRESS',
    createdAt:  '2026-04-28T11:00:00+09:00',
    updatedAt:  '2026-05-05T09:00:00+09:00',
  },
  {
    planId: 16,
    orderId: 16,
    productId: 116,
    productName: '점화 코일',
    lineId: 5,
    lineName: 'LINE-E',
    operatorId: 24,
    operatorName: '류지호',
    plannedStartAt: '2026-05-14T08:00:00+09:00',
    plannedEndAt:   '2026-05-17T18:00:00+09:00',
    estimatedDurationMin: 4320,
    plannedQuantity: 900,
    planSequence: 3,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-04T14:00:00+09:00',
    updatedAt:  '2026-05-04T14:00:00+09:00',
  },
  // ── Week 1 gap-fill (Apr 26 – May 2): LINE-B, C, D, F ─────────────────
  {
    planId: 20,
    orderId: 20,
    productId: 120,
    productName: '압력 센서',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 12,
    operatorName: '이수진',
    plannedStartAt: '2026-04-27T08:00:00+09:00',
    plannedEndAt:   '2026-05-02T17:00:00+09:00',
    estimatedDurationMin: 5400,
    plannedQuantity: 480,
    planSequence: 1,
    planStatus: 'COMPLETED',
    createdAt: '2026-04-20T09:00:00+09:00',
    updatedAt: '2026-05-02T17:00:00+09:00',
  },
  {
    planId: 21,
    orderId: 21,
    productId: 121,
    productName: '오일 필터',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 13,
    operatorName: '박민준',
    plannedStartAt: '2026-04-28T08:00:00+09:00',
    plannedEndAt:   '2026-05-02T18:00:00+09:00',
    estimatedDurationMin: 4320,
    plannedQuantity: 720,
    planSequence: 1,
    planStatus: 'COMPLETED',
    createdAt: '2026-04-21T10:00:00+09:00',
    updatedAt: '2026-05-02T18:00:00+09:00',
  },
  {
    planId: 22,
    orderId: 22,
    productId: 122,
    productName: '연료 펌프',
    lineId: 4,
    lineName: 'LINE-D',
    operatorId: 20,
    operatorName: '오지현',
    plannedStartAt: '2026-04-27T09:00:00+09:00',
    plannedEndAt:   '2026-05-01T17:00:00+09:00',
    estimatedDurationMin: 4800,
    plannedQuantity: 340,
    planSequence: 1,
    planStatus: 'COMPLETED',
    createdAt: '2026-04-20T08:00:00+09:00',
    updatedAt: '2026-05-01T17:00:00+09:00',
  },
  {
    planId: 23,
    orderId: 23,
    productId: 123,
    productName: '냉각 팬',
    lineId: 6,
    lineName: 'LINE-F',
    operatorId: 25,
    operatorName: '문서준',
    plannedStartAt: '2026-04-28T07:00:00+09:00',
    plannedEndAt:   '2026-05-02T17:00:00+09:00',
    estimatedDurationMin: 5760,
    plannedQuantity: 260,
    planSequence: 1,
    planStatus: 'COMPLETED',
    createdAt: '2026-04-21T07:00:00+09:00',
    updatedAt: '2026-05-02T17:00:00+09:00',
  },
  // ── Week 3 gap-fill (May 10–16): LINE-C ────────────────────────────────
  {
    planId: 24,
    orderId: 24,
    productId: 124,
    productName: '촉매 변환기',
    lineId: 3,
    lineName: 'LINE-C',
    operatorId: 17,
    operatorName: '강민호',
    plannedStartAt: '2026-05-11T08:00:00+09:00',
    plannedEndAt:   '2026-05-14T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 530,
    planSequence: 2,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-04T11:00:00+09:00',
    updatedAt: '2026-05-04T11:00:00+09:00',
  },
  // ── Week 4 gap-fill (May 17–23): LINE-A ────────────────────────────────
  {
    planId: 25,
    orderId: 25,
    productId: 125,
    productName: '크랭크 샤프트',
    lineId: 1,
    lineName: 'LINE-A',
    operatorId: 11,
    operatorName: '김도현',
    plannedStartAt: '2026-05-18T08:00:00+09:00',
    plannedEndAt:   '2026-05-22T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 150,
    planSequence: 4,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T09:00:00+09:00',
    updatedAt: '2026-05-08T09:00:00+09:00',
  },
  // ── Week 5+6 gap-fill (May 24–Jun 6): LINE-A, B, D, E, F ──────────────
  {
    planId: 26,
    orderId: 26,
    productId: 126,
    productName: '피스톤 링',
    lineId: 1,
    lineName: 'LINE-A',
    operatorId: 14,
    operatorName: '최지현',
    plannedStartAt: '2026-05-25T08:00:00+09:00',
    plannedEndAt:   '2026-06-02T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 2200,
    planSequence: 5,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T10:00:00+09:00',
    updatedAt: '2026-05-08T10:00:00+09:00',
  },
  {
    planId: 27,
    orderId: 27,
    productId: 127,
    productName: '밸브 스프링',
    lineId: 2,
    lineName: 'LINE-B',
    operatorId: 16,
    operatorName: '정은영',
    plannedStartAt: '2026-05-26T09:00:00+09:00',
    plannedEndAt:   '2026-06-01T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 1800,
    planSequence: 5,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T11:00:00+09:00',
    updatedAt: '2026-05-08T11:00:00+09:00',
  },
  {
    planId: 28,
    orderId: 28,
    productId: 128,
    productName: '타이밍 체인',
    lineId: 4,
    lineName: 'LINE-D',
    operatorId: 15,
    operatorName: '한상호',
    plannedStartAt: '2026-05-25T08:00:00+09:00',
    plannedEndAt:   '2026-06-02T18:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 680,
    planSequence: 3,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T09:00:00+09:00',
    updatedAt: '2026-05-08T09:00:00+09:00',
  },
  {
    planId: 29,
    orderId: 29,
    productId: 129,
    productName: '캠샤프트',
    lineId: 5,
    lineName: 'LINE-E',
    operatorId: 24,
    operatorName: '류지호',
    plannedStartAt: '2026-05-26T08:00:00+09:00',
    plannedEndAt:   '2026-06-01T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 390,
    planSequence: 4,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T10:00:00+09:00',
    updatedAt: '2026-05-08T10:00:00+09:00',
  },
  {
    planId: 30,
    orderId: 30,
    productId: 130,
    productName: '흡배기 밸브',
    lineId: 6,
    lineName: 'LINE-F',
    operatorId: 26,
    operatorName: '한지민',
    plannedStartAt: '2026-05-27T09:00:00+09:00',
    plannedEndAt:   '2026-06-03T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 1400,
    planSequence: 4,
    planStatus: 'SCHEDULED',
    createdAt: '2026-05-08T11:00:00+09:00',
    updatedAt: '2026-05-08T11:00:00+09:00',
  },
  // LINE-F plans (original)
  {
    planId: 17,
    orderId: 17,
    productId: 117,
    productName: '흡기 매니폴드',
    lineId: 6,
    lineName: 'LINE-F',
    operatorId: 25,
    operatorName: '문서준',
    plannedStartAt: '2026-05-04T07:00:00+09:00',
    plannedEndAt:   '2026-05-08T17:00:00+09:00',
    estimatedDurationMin: 3600,
    plannedQuantity: 560,
    planSequence: 1,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-04-27T09:00:00+09:00',
    updatedAt:  '2026-04-27T09:00:00+09:00',
  },
  {
    planId: 18,
    orderId: 18,
    productId: 118,
    productName: '스로틀 바디',
    lineId: 6,
    lineName: 'LINE-F',
    operatorId: 25,
    operatorName: '문서준',
    plannedStartAt: '2026-05-12T08:00:00+09:00',
    plannedEndAt:   '2026-05-16T17:00:00+09:00',
    estimatedDurationMin: null,
    plannedQuantity: 310,
    planSequence: 2,
    planStatus: 'DELAYED',
    createdAt:  '2026-05-05T10:00:00+09:00',
    updatedAt:  '2026-05-05T10:00:00+09:00',
  },
  {
    planId: 19,
    orderId: 19,
    productId: 119,
    productName: '에어 필터',
    lineId: 6,
    lineName: 'LINE-F',
    operatorId: 26,
    operatorName: '한지민',
    plannedStartAt: '2026-05-19T09:00:00+09:00',
    plannedEndAt:   '2026-05-22T18:00:00+09:00',
    estimatedDurationMin: 4500,
    plannedQuantity: 1100,
    planSequence: 3,
    planStatus: 'SCHEDULED',
    createdAt:  '2026-05-06T08:00:00+09:00',
    updatedAt:  '2026-05-06T08:00:00+09:00',
  },
]

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

// ── PLAN-002 ───────────────────────────────────────────────────────────────────

const MOCK_LINES = [
  { lineId: 1, lineName: 'LINE-A' },
  { lineId: 2, lineName: 'LINE-B' },
  { lineId: 3, lineName: 'LINE-C' },
  { lineId: 4, lineName: 'LINE-D' },
  { lineId: 5, lineName: 'LINE-E' },
  { lineId: 6, lineName: 'LINE-F' },
]

const MOCK_UPDATE_HISTORY = []

const NON_EDITABLE_STATUSES = ['COMPLETED', 'CANCELLED']

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

  if (NON_EDITABLE_STATUSES.includes(plan.planStatus)) {
    const err = new Error(`${plan.planStatus} 상태의 계획은 수정할 수 없습니다.`)
    err.status = 422
    throw err
  }

  // Field validation
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

  if (Object.keys(errors).length > 0) {
    const err = new Error('입력값을 확인해주세요.')
    err.status = 422
    err.validationErrors = errors
    throw err
  }

  // Schedule overlap check (same line, overlapping window, excluding self and final-state plans)
  const lineId   = Number(payload.lineId)
  const newStart = new Date(payload.plannedStartAt)
  const newEnd   = new Date(payload.plannedEndAt)
  const hasOverlap = MOCK_PLANS.some(p =>
    p.planId !== planId &&
    p.lineId === lineId &&
    !NON_EDITABLE_STATUSES.includes(p.planStatus) &&
    new Date(p.plannedStartAt) < newEnd &&
    new Date(p.plannedEndAt)   > newStart
  )
  if (hasOverlap) {
    const err = new Error('선택한 라인의 해당 시간대에 이미 다른 계획이 존재합니다.')
    err.status = 409
    throw err
  }

  // Determine whether recalculation is required
  const recalculationRequired =
    payload.plannedStartAt          !== plan.plannedStartAt ||
    payload.plannedEndAt            !== plan.plannedEndAt   ||
    lineId                          !== plan.lineId         ||
    Number(payload.plannedQuantity) !== plan.plannedQuantity

  // Build audit diff
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

  MOCK_UPDATE_HISTORY.push({
    historyId: MOCK_UPDATE_HISTORY.length + 1,
    planId,
    updatedAt:             new Date().toISOString(),
    updatedBy:             '담당자',
    changedFields,
    recalculationRequired,
  })

  // Apply update
  const selectedLine = MOCK_LINES.find(l => l.lineId === lineId)
  MOCK_PLANS[idx] = {
    ...plan,
    lineId,
    lineName:             selectedLine?.lineName ?? plan.lineName,
    planSequence:         Number(payload.planSequence),
    plannedStartAt:       payload.plannedStartAt,
    plannedEndAt:         payload.plannedEndAt,
    plannedQuantity:      Number(payload.plannedQuantity),
    estimatedDurationMin: recalculationRequired ? null : plan.estimatedDurationMin,
    updatedAt:            new Date().toISOString(),
  }

  return { plan: { ...MOCK_PLANS[idx] } }
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
