export const REPORT_TYPES = {
  MONTHLY: "MONTHLY",
  AD_HOC: "ON_DEMAND",
  EXECUTIVE: "MONTHLY_BUSINESS",
  ON_DEMAND: "ON_DEMAND",
  MONTHLY_BUSINESS: "MONTHLY_BUSINESS",
  ON_DEMAND_BUSINESS: "ON_DEMAND_BUSINESS",
};

export const REPORT_TYPE_LABELS = {
  [REPORT_TYPES.MONTHLY]: "월간",
  [REPORT_TYPES.AD_HOC]: "수시",
  [REPORT_TYPES.MONTHLY_BUSINESS]: "경영 요약",
  [REPORT_TYPES.ON_DEMAND_BUSINESS]: "경영 요약",
};

export const REPORT_TYPE_TONES = {
  [REPORT_TYPES.MONTHLY]: "pending",
  [REPORT_TYPES.AD_HOC]: "normal",
  [REPORT_TYPES.MONTHLY_BUSINESS]: "risk",
  [REPORT_TYPES.ON_DEMAND_BUSINESS]: "risk",
};

export const ISSUE_IMPACT = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
};

export const ISSUE_IMPACT_LABELS = {
  [ISSUE_IMPACT.HIGH]: "높음",
  [ISSUE_IMPACT.MEDIUM]: "보통",
  [ISSUE_IMPACT.LOW]: "낮음",
};

export const ISSUE_IMPACT_TONES = {
  [ISSUE_IMPACT.HIGH]: "shortage",
  [ISSUE_IMPACT.MEDIUM]: "risk",
  [ISSUE_IMPACT.LOW]: "normal",
};

export const MONTH_OPTIONS = [
  { value: "2024-05", label: "2024년 05월" },
  { value: "2024-04", label: "2024년 04월" },
  { value: "2024-03", label: "2024년 03월" },
  { value: "2024-02", label: "2024년 02월" },
  { value: "2024-01", label: "2024년 01월" },
];
