import { ISSUE_IMPACT, REPORT_TYPES } from "./constants.js";

export const mockReports = [
  {
    id: 1,
    createdAt: "2024.05.25 10:30",
    title: "5월 3주차 생산 보고서",
    configuredAt: "2024.05.25 10:30",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 2,
    createdAt: "2024.05.20 09:15",
    title: "5월 2주차 생산 보고서",
    configuredAt: "2024.05.20 09:15",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 3,
    createdAt: "2024.05.13 09:05",
    title: "5월 1주차 생산 보고서",
    configuredAt: "2024.05.13 09:05",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 4,
    createdAt: "2024.05.07 14:22",
    title: "긴급 생산 현황 보고서",
    configuredAt: "2024.05.07 14:22",
    type: REPORT_TYPES.AD_HOC,
    author: "홍길동",
  },
  {
    id: 5,
    createdAt: "2024.04.30 17:45",
    title: "4월 월간 생산 보고서",
    configuredAt: "2024.04.30 17:45",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 6,
    createdAt: "2024.04.23 09:12",
    title: "4월 3주차 생산 보고서",
    configuredAt: "2024.04.23 09:12",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 7,
    createdAt: "2024.04.16 09:08",
    title: "4월 2주차 생산 보고서",
    configuredAt: "2024.04.16 09:08",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 8,
    createdAt: "2024.04.09 11:30",
    title: "4월 1주차 생산 보고서",
    configuredAt: "2024.04.09 11:30",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
  {
    id: 9,
    createdAt: "2024.04.05 16:40",
    title: "설비 점검 결과 보고서",
    configuredAt: "2024.04.05 16:40",
    type: REPORT_TYPES.AD_HOC,
    author: "김철수",
  },
  {
    id: 10,
    createdAt: "2024.03.31 17:20",
    title: "3월 월간 생산 보고서",
    configuredAt: "2024.03.31 17:20",
    type: REPORT_TYPES.MONTHLY,
    author: "관리자",
  },
];

export const mockIssues = [
  {
    id: 1,
    occurredAt: "2024.05.24 14:35",
    type: "자재 부족",
    content: "주요 원자재 A의 재고 부족으로 생산 지연 발생",
    impact: ISSUE_IMPACT.HIGH,
    result: "대체 자재 투입으로 생산 정상화",
  },
  {
    id: 2,
    occurredAt: "2024.05.19 09:10",
    type: "설비 고장",
    content: "라인 B의 핵심 장비 고장으로 가동 중단",
    impact: ISSUE_IMPACT.HIGH,
    result: "장비 수리 완료, 가동 재개",
  },
  {
    id: 3,
    occurredAt: "2024.05.12 16:25",
    type: "품질 이슈",
    content: "제품 C의 불량률 상승",
    impact: ISSUE_IMPACT.MEDIUM,
    result: "원인 분석 후 공정 조건 조정",
  },
  {
    id: 4,
    occurredAt: "2024.04.28 11:05",
    type: "생산 지연",
    content: "작업 지연으로 인한 납기 지연 발생",
    impact: ISSUE_IMPACT.MEDIUM,
    result: "추가 인력 투입으로 일정 회복",
  },
  {
    id: 5,
    occurredAt: "2024.04.15 10:50",
    type: "설비 점검",
    content: "정기 설비 점검 및 유지보수 진행",
    impact: ISSUE_IMPACT.LOW,
    result: "이상 없음",
  },
];

export const mockReportDetail = {
  id: 1,
  title: "2024년 05월 월간 생산 보고서",
  author: "관리자",
  createdAt: "2024.05.25 10:30",
  typeLabel: "월간",
  period: {
    startDate: "2024.05.01",
    endDate: "2024.05.31",
  },
  summaryRows: [
    { label: "보고서 기간", value: "2024.05.01 ~ 2024.05.31", change: "-" },
    { label: "총 생산 계획 수량", value: "120,000 EA", change: "-" },
    { label: "총 생산 완료 수량", value: "115,200 EA", change: "-" },
    { label: "생산 계획 대비 실적", value: "96.0%", change: "↓ 4.0%p" },
    { label: "라인 가동률", value: "88.5%", change: "↓ 2.1%p" },
    { label: "Cycle Time (평균)", value: "54.2 초", change: "↑ 1.8 초" },
    { label: "불량 수량", value: "1,152 EA", change: "-" },
    { label: "불량률", value: "1.00%", change: "↑ 0.12%p" },
    { label: "설비 다운 타임", value: "18.6 시간", change: "↓ 3.4 시간" },
    { label: "작업자 투입 시간", value: "2,048.5 시간", change: "-" },
    { label: "안전 사고 건수", value: "1 건", change: "-" },
    { label: "납기 준수율", value: "98.1%", change: "↑ 1.3%p" },
  ],
  lineRows: [
    {
      line: "A 라인",
      utilization: "91.2%",
      completed: "45,600 EA",
      defectRate: "0.95%",
      note: "↑ 우수",
    },
    {
      line: "B 라인",
      utilization: "87.3%",
      completed: "38,400 EA",
      defectRate: "1.20%",
      note: "↓ 주의",
    },
    {
      line: "C 라인",
      utilization: "86.0%",
      completed: "31,200 EA",
      defectRate: "0.85%",
      note: "↑ 우수",
    },
  ],
  equipmentRows: [
    {
      name: "설비 01",
      utilization: "92.1%",
      downTime: "6.3 시간",
      status: "정상",
    },
    {
      name: "설비 02",
      utilization: "87.4%",
      downTime: "9.8 시간",
      status: "정상",
    },
    {
      name: "설비 03",
      utilization: "91.0%",
      downTime: "7.2 시간",
      status: "정상",
    },
    {
      name: "설비 04",
      utilization: "83.2%",
      downTime: "11.4 시간",
      status: "주의",
    },
    {
      name: "설비 05",
      utilization: "88.7%",
      downTime: "8.6 시간",
      status: "정상",
    },
  ],
  analysis: {
    overview:
      "2024년 5월 한 달간의 생산 활동을 분석한 결과, 전반적으로 안정적인 운영이 이루어졌으나 일부 지표에서 개선이 필요한 부분이 확인되었습니다.",
    sections: [
      {
        title: "생산 실적 분석",
        items: [
          "총 생산 완료 수량은 115,200 EA로, 계획 대비 96.0%의 실적을 달성하였습니다.",
          "생산 계획 대비 실적이 전월 대비 4.0%p 하락하였으며, 이는 라인 B의 가동률 저하 영향이 주요 원인으로 분석됩니다.",
        ],
      },
      {
        title: "설비 및 라인 현황",
        items: [
          "라인 평균 가동률은 88.5%로 전월 대비 2.1%p 하락하였으며, 특히 라인 B의 가동률이 87.3%로 가장 낮았습니다.",
          "설비 04의 가동률이 83.2%로 가장 낮고 다운 타임이 11.4시간으로 많아 생산성에 영향을 미쳤습니다.",
        ],
      },
      {
        title: "품질 및 안전 현황",
        items: [
          "전체 불량률은 1.00%로 전월 대비 0.12%p 증가하였습니다.",
          "안전 사고는 1건 발생하였으며, 작업 환경 및 안전 수칙 준수 강화가 필요합니다.",
        ],
      },
    ],
    recommendation:
      "라인 B 및 설비 04의 운영 효율 개선을 우선 과제로 설정하고, 정기 점검 및 예방 유지보수를 강화하여 가동률을 향상시키는 것이 필요합니다. 또한 품질 관리 프로세스 점검을 통해 불량률 감소를 도모해야 합니다.",
  },
};