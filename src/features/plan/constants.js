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
  'ABS 주 생산 Line': { bg: '#E8F1FF', },
  'ABS 보조 생산 Line': { bg: '#EDF7E8', },
  'PP 범용 생산 Line': { bg: '#F1E8FA', },
  'PE 범용 생산 Line': { bg: '#FCE8EA', },
  'PE 특화 생산 Line': { bg: '#FEF0DE', },
  'PP 기능성 생산 Line': { bg: '#E1F4F5', },
  'LINE-A': { bg: '#E8F1FF', },
  'LINE-B': { bg: '#EDF7E8', },
  'LINE-C': { bg: '#F1E8FA', },
  'LINE-D': { bg: '#FCE8EA', },
  'LINE-E': { bg: '#FEF0DE', },
  'LINE-F': { bg: '#E1F4F5', },
}

export const FIXED_LINE_ORDER = [
  'ABS 주 생산 Line',
  'ABS 보조 생산 Line',
  'PP 범용 생산 Line',
  'PE 범용 생산 Line',
  'PE 특화 생산 Line',
  'PP 기능성 생산 Line',
  'LINE-A',
  'LINE-B',
  'LINE-C',
  'LINE-D',
  'LINE-E',
  'LINE-F',
]
