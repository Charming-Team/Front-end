export const riskSummary = {
  expectedDelayDays: 19.2,
  delayedOrderCount: 18,
  materialShortageCount: 3,
  materialShortageQuantity: 5400,
  criticalOrderCount: 5,
  overallRiskLevel: 'HIGH',
};

export const riskItems = [
  {
    id: 1,
    orderNo: 'ORD-198',
    customerName: 'A사',
    productName: 'ABS-Black',
    quantity: 1000,
    dueDate: '2026-06-21',
    progressRate: 30,
    lineName: 'LINE-A',
    riskLevel: 'CRITICAL',
  },
  {
    id: 2,
    orderNo: 'ORD-199',
    customerName: 'B사',
    productName: 'PP-Heat',
    quantity: 800,
    dueDate: '2026-08-18',
    progressRate: 50,
    lineName: 'LINE-B',
    riskLevel: 'WARNING',
  },
  {
    id: 3,
    orderNo: 'ORD-200',
    customerName: 'C사',
    productName: 'PE-Clear',
    quantity: 600,
    dueDate: '2026-09-06',
    progressRate: 62,
    lineName: 'LINE-C',
    riskLevel: 'CAUTION',
  },
  {
    id: 4,
    orderNo: 'ORD-201',
    customerName: 'D사',
    productName: 'ABS-Gray',
    quantity: 500,
    dueDate: '2026-06-29',
    progressRate: 80,
    lineName: 'LINE-A',
    riskLevel: 'CAUTION',
  },
  {
    id: 5,
    orderNo: 'ORD-202',
    customerName: 'E사',
    productName: 'PP-Heat',
    quantity: 700,
    dueDate: '2026-07-13',
    progressRate: 95,
    lineName: 'LINE-B',
    riskLevel: 'SAFE',
  },
  {
    id: 6,
    orderNo: 'ORD-205',
    customerName: 'F사',
    productName: 'PA-Natural',
    quantity: 1200,
    dueDate: '2026-07-04',
    progressRate: 44,
    lineName: 'LINE-D',
    riskLevel: 'WARNING',
  },
];
export const riskDetailMap = {
  'ORD-198': {
    orderNo: 'ORD-198',
    expectedCompletionDate: '2026-07-10',
    predictedDelayDays: 19.2,
    delayProbability: 0.86,
    riskLevel: 'CRITICAL',
    summary:
      'ORD-198은 현재 생산계획 기준 납기일을 초과할 가능성이 높습니다. 주요 원인은 자재 부족과 수율 저하이며, LINE-A의 대기 작업 증가도 지연 가능성을 높이고 있습니다.',
    causes: [
      {
        type: 'MATERIAL_SHORTAGE',
        label: '자재 부족',
        impact: '예상 지연 +10.5일',
        description: 'ABS-Black 생산에 필요한 핵심 원료의 가용 재고가 계획 수량 대비 부족합니다.',
        evidence: '필요 수량 8,200개 / 가용 수량 5,400개',
      },
      {
        type: 'LOW_YIELD',
        label: '수율 저하',
        impact: '예상 지연 +5.1일',
        description: '최근 동일 제품 생산 수율이 표준 수율보다 낮아 추가 생산 가능성이 있습니다.',
        evidence: '표준 수율 94% / 현재 예상 수율 88%',
      },
      {
        type: 'LINE_WAITING_INCREASE',
        label: '라인 대기시간 증가',
        impact: '예상 지연 +3.6일',
        description: 'LINE-A에 선행 작업이 집중되어 주문 투입 시점이 지연될 가능성이 있습니다.',
        evidence: 'LINE-A 대기 작업 4건 / 평균 대기시간 18.5시간',
      },
    ],
    actions: [
      {
        title: '부족 자재 선주문 요청',
        description: '부족 자재 2,800개에 대해 긴급 구매 요청을 생성합니다.',
      },
      {
        title: '대체 라인 검토',
        description: 'ABS-Black 생산 가능한 LINE-B로 일부 물량을 재배정하는 방안을 검토합니다.',
      },
      {
        title: '고위험 주문 우선순위 상향',
        description: '납기 위약금이 큰 주문부터 우선 생산하도록 생산 순서를 조정합니다.',
      },
    ],
    relatedPlans: [
      {
        planId: 'PLAN-104',
        lineName: 'LINE-A',
        plannedStartAt: '2026-06-18 09:00',
        plannedEndAt: '2026-06-24 18:00',
        status: 'DELAYED',
      },
      {
        planId: 'PLAN-108',
        lineName: 'LINE-B',
        plannedStartAt: '2026-06-24 09:00',
        plannedEndAt: '2026-06-28 18:00',
        status: 'SCHEDULED',
      },
    ],
  },
  'ORD-205': {
    orderNo: 'ORD-205',
    expectedCompletionDate: '2026-07-08',
    predictedDelayDays: 4.3,
    delayProbability: 0.68,
    riskLevel: 'WARNING',
    summary:
      'ORD-205는 자재 부족으로 인해 계획된 생산 투입 시점이 지연될 가능성이 있습니다. PA-Natural 원료 입고 일정과 LINE-D의 대기 작업을 함께 확인해야 합니다.',
    causes: [
      {
        type: 'MATERIAL_SHORTAGE',
        label: '자재 부족',
        impact: '예상 지연 +3.1일',
        description: 'PA-Natural 생산에 필요한 주요 원료의 입고 수량이 계획 대비 부족합니다.',
        evidence: '필요 수량 6,500개 / 가용 수량 4,900개',
      },
      {
        type: 'LINE_WAITING_INCREASE',
        label: '라인 대기시간 증가',
        impact: '예상 지연 +1.2일',
        description: 'LINE-D에 선행 작업과 전환 작업이 겹쳐 주문 투입이 늦어질 수 있습니다.',
        evidence: 'LINE-D 대기 작업 3건 / 평균 대기시간 9.5시간',
      },
    ],
    actions: [
      {
        title: '부족 자재 입고 일정 확인',
        description: '구매 담당자에게 PA-Natural 원료 입고 가능 일정을 확인합니다.',
      },
      {
        title: '대체 자재 사용 검토',
        description: '동일 규격의 대체 자재 사용 가능 여부를 품질 기준과 함께 검토합니다.',
      },
      {
        title: 'LINE-D 작업 순서 조정',
        description: '전환 작업 시간을 줄일 수 있도록 유사 제품 작업을 묶어 재배치합니다.',
      },
    ],
    relatedPlans: [
      {
        planId: 'PLAN-205',
        lineName: 'LINE-D',
        plannedStartAt: '2026-07-01 09:00',
        plannedEndAt: '2026-07-04 18:00',
        status: 'SCHEDULED',
      },
    ],
  },
};
