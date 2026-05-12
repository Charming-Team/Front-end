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
  'LINE-A': { bg: '#E8F1FF', chip: '#DBEAFE', border: '#B7D0FF', text: '#214E9F' },
  'LINE-B': { bg: '#EDF7E8', chip: '#DCFCE7', border: '#C9E2BF', text: '#3E7B31' },
  'LINE-C': { bg: '#F1E8FA', chip: '#EDE9FE', border: '#D7C1F1', text: '#6F43C0' },
  'LINE-D': { bg: '#FCE8EA', chip: '#FFE4E6', border: '#F5C2C7', text: '#E15B47' },
  'LINE-E': { bg: '#FEF0DE', chip: '#FEF3C7', border: '#F6D4A7', text: '#D97706' },
  'LINE-F': { bg: '#E1F4F5', chip: '#CCFBF1', border: '#B9E3E5', text: '#0F8E9C' },
}

export const FIXED_LINE_ORDER = ['LINE-A', 'LINE-B', 'LINE-C', 'LINE-D', 'LINE-E', 'LINE-F']
