export const PLAN_STATUS_LABELS = {
  SCHEDULED:   '예정',
  IN_PROGRESS: '진행중',
  COMPLETED:   '완료',
  DELAYED:     '지연',
  CANCELLED:   '취소',
}

export const PLAN_STATUS_OPTIONS = [
  { value: '',            label: '전체 상태' },
  { value: 'SCHEDULED',  label: '예정' },
  { value: 'IN_PROGRESS',label: '진행중' },
  { value: 'COMPLETED',  label: '완료' },
  { value: 'DELAYED',    label: '지연' },
  { value: 'CANCELLED',  label: '취소' },
]

export const LINE_THEMES = {
  'ABS 주 생산 Line': { bg: '#5a8eff', },
  'ABS 보조 생산 Line': { bg: '#aac0ef', },
  'PP 범용 생산 Line': { bg: '#1eb957', },
  'PE 범용 생산 Line': { bg: '#8ae0aa', },
  'PE 특화 생산 Line': { bg: '#e3eb6a', },
  'PP 기능성 생산 Line': { bg: '#eef2bf', },
}

export const FIXED_LINE_ORDER = [
  'ABS 주 생산 Line',
  'ABS 보조 생산 Line',
  'PP 범용 생산 Line',
  'PE 범용 생산 Line',
  'PE 특화 생산 Line',
  'PP 기능성 생산 Line',
]
