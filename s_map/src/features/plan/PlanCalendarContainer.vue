<script setup>
import { computed, ref } from 'vue'
import PlanCalendarView from '../../components/calendar/PlanCalendarView.vue'

const props = defineProps({
  plans: { type: Array, default: () => [] },
  lines: { type: Array, default: () => [] },
  selectedPlanId: { type: [Number, null], default: null },
})

const emit = defineEmits(['select-plan'])

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

const STATUS_COLOR = {
  SCHEDULED: '#1565C0',
  IN_PROGRESS: '#00897B',
  COMPLETED: '#546E7A',
  DELAYED: '#C62828',
  CANCELLED: '#757575',
}

const DOW_LABELS = ['일', '월', '화', '수', '목', '금', '토']
const LEGEND_ITEMS = [
  { label: '예정', className: 'plan-cal-legend-item--scheduled' },
  { label: '진행중', className: 'plan-cal-legend-item--in-progress' },
  { label: '완료', className: 'plan-cal-legend-item--completed' },
  { label: '지연', className: 'plan-cal-legend-item--delayed' },
  { label: '취소', className: 'plan-cal-legend-item--cancelled' },
]

function getMonthStart(date) {
  const next = new Date(date)
  next.setDate(1)
  next.setHours(0, 0, 0, 0)
  return next
}

function isToday(date) {
  const today = new Date()
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

function isCurrentMonth(date, month) {
  return date.getMonth() === month.getMonth()
}

const anchorDate = ref(new Date())

const monthStart = computed(() => getMonthStart(anchorDate.value))
const monthEnd = computed(() => {
  const next = new Date(monthStart.value)
  next.setMonth(next.getMonth() + 1)
  return next
})

const calendarWeeks = computed(() => {
  const calendarStart = new Date(monthStart.value)
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay())
  calendarStart.setHours(0, 0, 0, 0)

  const weeks = []
  const cursor = new Date(calendarStart)

  while (cursor < monthEnd.value) {
    const days = Array.from({ length: 7 }, () => {
      const day = new Date(cursor)
      cursor.setDate(cursor.getDate() + 1)
      return day
    })

    weeks.push({
      key: days[0].toISOString(),
      weekStart: days[0],
      weekEnd: new Date(days[6].getTime() + DAY_MS),
      days: days.map(day => ({
        key: day.toISOString(),
        date: day.getDate(),
        classes: {
          'pc-today': isToday(day),
          'pc-other-month': !isCurrentMonth(day, monthStart.value),
          'pc-weekend': day.getDay() === 0 || day.getDay() === 6,
        },
      })),
    })
  }

  return weeks
})

function buildWeekItems(week) {
  const weekStart = week.weekStart.getTime()
  const weekEnd = week.weekEnd.getTime()

  const matching = props.plans
    .filter(plan => {
      const start = new Date(plan.plannedStartAt).getTime()
      const end = new Date(plan.plannedEndAt).getTime()
      return start < weekEnd && end > weekStart
    })
    .sort((left, right) => new Date(left.plannedStartAt) - new Date(right.plannedStartAt))

  const slotEnds = []

  return matching.map(plan => {
    const planStart = Math.max(new Date(plan.plannedStartAt).getTime(), weekStart)
    const planEnd = Math.min(new Date(plan.plannedEndAt).getTime(), weekEnd)

    let slot = slotEnds.findIndex(value => value <= planStart)
    if (slot === -1) slot = slotEnds.length
    slotEnds[slot] = planEnd

    const left = (planStart - weekStart) / WEEK_MS * 100
    const width = Math.max((planEnd - planStart) / WEEK_MS * 100, 1.5)
    const color = STATUS_COLOR[plan.planStatus] ?? '#607D8B'
    const selected = plan.planId === props.selectedPlanId

    return {
      key: `${week.key}-${plan.planId}`,
      plan,
      label: `${plan.lineName} · ${plan.productName}`,
      title: `[${plan.lineName}] ${plan.productName} · ${plan.planStatus}`,
      style: {
        left: `${left}%`,
        width: `${width}%`,
        top: `${slot * 24 + 2}px`,
        '--bar-color': color,
        fontWeight: selected ? '800' : '700',
        opacity: selected ? '1' : '0.92',
      },
      slot,
    }
  })
}

const weeks = computed(() =>
  calendarWeeks.value.map(week => {
    const items = buildWeekItems(week)
    const maxSlot = items.length ? Math.max(...items.map(item => item.slot)) : -1

    return {
      ...week,
      items,
      eventsHeight: maxSlot === -1 ? 6 : (maxSlot + 1) * 24 + 6,
    }
  })
)

const monthLabel = computed(() => {
  const current = monthStart.value
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월`
})

function prevMonth() {
  const next = new Date(anchorDate.value)
  next.setMonth(next.getMonth() - 1)
  anchorDate.value = next
}

function nextMonth() {
  const next = new Date(anchorDate.value)
  next.setMonth(next.getMonth() + 1)
  anchorDate.value = next
}

function goToday() {
  anchorDate.value = new Date()
}
</script>

<template>
  <PlanCalendarView
    :month-label="monthLabel"
    :dow-labels="DOW_LABELS"
    :weeks="weeks"
    :legend-items="LEGEND_ITEMS"
    @prev-month="prevMonth"
    @next-month="nextMonth"
    @go-today="goToday"
    @select-plan="emit('select-plan', $event)"
  />
</template>
