export const riskLevelMap = {
  CRITICAL: {
    label: '매우 위험',
    className: 'risk-badge risk-badge--critical',
  },
  WARNING: {
    label: '위험',
    className: 'risk-badge risk-badge--warning',
  },
  CAUTION: {
    label: '주의',
    className: 'risk-badge risk-badge--caution',
  },
  SAFE: {
    label: '안전',
    className: 'risk-badge risk-badge--safe',
  },
};

export const riskCauseTypeMap = {
  MATERIAL_SHORTAGE: {
    label: '자재 부족',
    className: 'risk-cause-badge risk-cause-badge--material',
  },
  LOW_YIELD: {
    label: '수율 저하',
    className: 'risk-cause-badge risk-cause-badge--yield',
  },
  LINE_WAITING_INCREASE: {
    label: '라인 대기 증가',
    className: 'risk-cause-badge risk-cause-badge--waiting',
  },
  LOW_THROUGHPUT: {
    label: '처리량 부족',
    className: 'risk-cause-badge risk-cause-badge--throughput',
  },
  MACHINE_STATUS_ABNORMAL: {
    label: '설비 상태 이상',
    className: 'risk-cause-badge risk-cause-badge--machine',
  },
};

export function getRiskCauseLabel(type) {
  return riskCauseTypeMap[type]?.label ?? '기타 원인';
}

export function getRiskCauseBadgeClass(type) {
  return riskCauseTypeMap[type]?.className ?? 'risk-cause-badge';
}

export function formatNumber(value) {
  return Number(value).toLocaleString();
}

export function getRiskLevelLabel(level) {
  return riskLevelMap[level]?.label ?? '확인 필요';
}

export function getRiskBadgeClass(level) {
  return riskLevelMap[level]?.className ?? 'risk-badge';
}
