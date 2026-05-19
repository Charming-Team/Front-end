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

export function formatNumber(value) {
  return Number(value).toLocaleString();
}

export function getRiskLevelLabel(level) {
  return riskLevelMap[level]?.label ?? '확인 필요';
}

export function getRiskBadgeClass(level) {
  return riskLevelMap[level]?.className ?? 'risk-badge';
}
