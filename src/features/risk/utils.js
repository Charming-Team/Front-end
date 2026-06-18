export const riskLevelMap = {
  CRITICAL: {
    label: '매우 위험',
    className: 'risk-badge risk-badge-critical',
  },
  WARNING: {
    label: '위험',
    className: 'risk-badge risk-badge-warning',
  },
  CAUTION: {
    label: '주의',
    className: 'risk-badge risk-badge-caution',
  },
  SAFE: {
    label: '안전',
    className: 'risk-badge risk-badge-safe',
  },
};

export const riskCauseTypeMap = {
  MATERIAL_SHORTAGE: {
    label: '자재 부족',
    className: 'risk-cause-badge risk-cause-badge-material',
  },
  MATERIAL_DELAY: {
    label: '자재 입고 지연',
    className: 'risk-cause-badge risk-cause-badge-material-delay',
  },
  LOW_YIELD: {
    label: '수율 저하',
    className: 'risk-cause-badge risk-cause-badge-yield',
  },
  MACHINE_ABNORMAL: {
    label: '설비 상태 이상',
    className: 'risk-cause-badge risk-cause-badge-machine',
  },
  LINE_ABNORMAL: {
    label: '라인 상태 이상',
    className: 'risk-cause-badge risk-cause-badge-line',
  },
};

function normalizeRiskCauseType(type) {
  if (!type) return null;

  const normalized = String(type).trim().toUpperCase();

  if (normalized === 'MACHINE_STATUS_ABNORMAL') {
    return 'MACHINE_ABNORMAL';
  }

  if (
    normalized === 'LINE_WAITING_INCREASE' ||
    normalized === 'LOW_THROUGHPUT' ||
    normalized === 'LINE_LOAD' ||
    normalized === 'LINE_CAPACITY' ||
    normalized === 'LINE_RISK'
  ) {
    return 'LINE_ABNORMAL';
  }

  if (normalized === 'YIELD_RISK' || normalized === 'LOW_YIELD') {
    return 'LOW_YIELD';
  }

  if (normalized === 'MATERIAL_NOT_READY' || normalized === 'MATERIAL_SHORTAGE') {
    return 'MATERIAL_SHORTAGE';
  }

  if (normalized === 'MATERIAL_DELAY') {
    return 'MATERIAL_DELAY';
  }

  return normalized;
}

export function getRiskCauseLabel(type) {
  const normalizedType = normalizeRiskCauseType(type);
  return riskCauseTypeMap[normalizedType]?.label ?? '상세 분석 생성 후 제공';
}

export function getRiskCauseBadgeClass(type) {
  const normalizedType = normalizeRiskCauseType(type);
  return riskCauseTypeMap[normalizedType]?.className ?? 'risk-cause-badge';
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
