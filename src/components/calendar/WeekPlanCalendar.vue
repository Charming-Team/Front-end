<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid/index.js'
import interactionPlugin from '@fullcalendar/interaction/index.js'
import koLocale from '@fullcalendar/core/locales/ko.js'

const props = defineProps({
  anchorDate: { type: Date, required: true },
  events: { type: Array, default: () => [] },
  previewEvents: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
  statusLabels: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'select-plan',
  'update-range-label',
  'move-plan',
  'preview-plan-move',
  'clear-plan-move-preview',
])

const rootRef = ref(null)
const calendarRef = ref(null)
const previewSegments = ref([])
const lastPreviewKey = ref('')
const BLOCKED_MOVE_STATUSES = ['COMPLETED', 'CANCELLED']
const DAY_IN_MS = 86_400_000
const LANE_HEIGHT = 27
const PREVIEW_BAR_HEIGHT = 24

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function isTodayDate(date) {
  const today = startOfDay(new Date())
  return startOfDay(date).getTime() === today.getTime()
}

function formatWeekLabel(date) {
  const anchor = startOfDay(date)
  const start = addDays(anchor, -3)
  const end = addDays(anchor, 3)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()

  if (sameMonth) {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getDate()}일`
  }

  if (sameYear) {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`
  }

  return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`
}

function emitPlanMove(info) {
  const plan = info.event.extendedProps.plan
  if (!plan || !info.event.start) {
    info.revert()
    return
  }

  emit('clear-plan-move-preview')
  lastPreviewKey.value = ''

  const newStart = startOfDay(info.event.start)
  const originalStart = startOfDay(plan.plannedStartAt)
  const deltaDays = Math.round((newStart - originalStart) / DAY_IN_MS)

  emit('move-plan', {
    planId: plan.planId,
    deltaDays,
    revert: () => info.revert(),
  })
}

function emitPlanMovePreview(dropInfo, draggedEvent) {
  const plan = draggedEvent.extendedProps.plan
  if (!props.editable || !plan || !dropInfo.start) return

  const newStart = startOfDay(dropInfo.start)
  const originalStart = startOfDay(plan.plannedStartAt)
  const deltaDays = Math.round((newStart - originalStart) / DAY_IN_MS)
  const previewKey = `${plan.planId}:${deltaDays}`
  if (previewKey === lastPreviewKey.value) return

  lastPreviewKey.value = previewKey
  emit('preview-plan-move', { planId: plan.planId, deltaDays })
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function eachPlanDate(plan) {
  const dates = []
  for (let date = startOfDay(plan.plannedStartAt); date <= startOfDay(plan.plannedEndAt); date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date))
  }
  return dates
}

function buildPreviewSegments() {
  nextTick(() => {
    const root = rootRef.value
    if (!root || props.previewEvents.length === 0) {
      previewSegments.value = []
      return
    }

    const rootRect = root.getBoundingClientRect()
    const segments = []

    props.previewEvents.forEach(event => {
      const plan = event.extendedProps.plan
      const lineOrder = event.extendedProps.lineOrder ?? 0
      const visibleCells = eachPlanDate(plan)
        .map(date => root.querySelector(`.fc-daygrid-day[data-date="${formatDateKey(date)}"]`))
        .filter(Boolean)
        .map(cell => ({ cell, rect: cell.getBoundingClientRect() }))

      const rows = []
      visibleCells.forEach(item => {
        const row = rows.find(candidate => Math.abs(candidate.top - item.rect.top) < 2)
        if (row) {
          row.items.push(item)
        } else {
          rows.push({ top: item.rect.top, items: [item] })
        }
      })

      rows.forEach(row => {
        const items = row.items.sort((left, right) => left.rect.left - right.rect.left)
        const first = items[0]
        const last = items[items.length - 1]
        const eventsArea = first.cell.querySelector('.fc-daygrid-day-events')?.getBoundingClientRect() ?? first.rect
        segments.push({
          id: `${event.id}-${Math.round(row.top)}`,
          title: event.title,
          left: first.rect.left - rootRect.left + 6,
          top: eventsArea.top - rootRect.top + (lineOrder * LANE_HEIGHT) + 4,
          width: last.rect.right - first.rect.left - 12,
          height: PREVIEW_BAR_HEIGHT,
          backgroundColor: event.backgroundColor,
          borderColor: event.borderColor,
          textColor: event.textColor,
        })
      })
    })

    previewSegments.value = segments
  })
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: koLocale,
  initialView: 'dayGrid',
  initialDate: props.anchorDate,
  visibleRange: (currentDate) => {
    const anchor = startOfDay(currentDate)
    return {
      start: addDays(anchor, -3),
      end: addDays(anchor, 4),
    }
  },
  headerToolbar: false,
  height: 'auto',
  contentHeight: 'auto',
  fixedWeekCount: false,
  firstDay: 0,
  weekends: true,
  editable: props.editable,
  selectable: false,
  eventStartEditable: props.editable,
  eventDurationEditable: false,
  dayMaxEventRows: 6,
  displayEventTime: false,
  showNonCurrentDates: true,
  eventDisplay: 'block',
  eventOrder: 'order,start,-duration,title',
  eventOrderStrict: true,
  events: props.events,
  eventAllow: (_, draggedEvent) => {
    if (!props.editable) return false
    const plan = draggedEvent.extendedProps.plan
    if (!plan) return false
    const status = plan.planStatus
    return !BLOCKED_MOVE_STATUSES.includes(status)
  },
  eventDragStart: () => {
    lastPreviewKey.value = ''
    emit('clear-plan-move-preview')
  },
  eventDragStop: () => {
    lastPreviewKey.value = ''
    emit('clear-plan-move-preview')
  },
  eventDrop: emitPlanMove,
  eventClick: info => {
    const plan = info.event.extendedProps.plan
    if (plan) emit('select-plan', plan)
  },
}))

const previewAwareCalendarOptions = computed(() => ({
  ...calendarOptions.value,
  eventAllow: (dropInfo, draggedEvent) => {
    const allowed = calendarOptions.value.eventAllow(dropInfo, draggedEvent)
    if (allowed) emitPlanMovePreview(dropInfo, draggedEvent)
    return allowed
  },
}))

watch(
  () => props.anchorDate,
  value => {
    const api = calendarRef.value?.getApi()
    if (!api) return
    api.gotoDate(value)
  },
  { immediate: true }
)

watch(
  () => props.anchorDate,
  value => {
    emit('update-range-label', formatWeekLabel(value))
  },
  { immediate: true }
)

watch(
  () => props.previewEvents,
  buildPreviewSegments,
  { deep: true, flush: 'post' }
)

onMounted(() => {
  window.addEventListener('resize', buildPreviewSegments)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', buildPreviewSegments)
})
</script>

<template>
  <div
    ref="rootRef"
    class="week-plan-calendar
      relative
      [&_.fc]:font-sans
      [&_.fc]:text-slate-900
      [&_.fc-theme-standard_.fc-scrollgrid]:border-0
      [&_.fc-theme-standard_td]:border-slate-200
      [&_.fc-theme-standard_th]:border-slate-200
      [&_.fc_.fc-col-header-cell]:bg-slate-50
      [&_.fc_.fc-col-header-cell-cushion]:px-2
      [&_.fc_.fc-col-header-cell-cushion]:py-3
      [&_.fc_.fc-col-header-cell-cushion]:text-sm
      [&_.fc_.fc-col-header-cell-cushion]:font-semibold
      [&_.fc_.fc-col-header-cell.fc-day-today]:bg-blue-50/90
      [&_.fc_.fc-daygrid-day-top]:justify-end
      [&_.fc_.fc-daygrid-day-number]:px-2
      [&_.fc_.fc-daygrid-day-number]:py-2
      [&_.fc_.fc-daygrid-day-number]:text-sm
      [&_.fc_.fc-daygrid-day-number]:font-semibold
      [&_.fc_.fc-day-today]:bg-blue-50/85
      [&_.fc_.fc-day-today]:shadow-[inset_0_0_0_1px_rgba(59,130,246,0.12)]
      [&_.fc_.fc-daygrid-day-frame]:min-h-[340px]
      [&_.fc_.fc-daygrid-day-events]:px-2
      [&_.fc_.fc-daygrid-event-harness]:my-1
      [&_.fc_.fc-daygrid-event-harness]:px-1
      [&_.fc_.fc-daygrid-block-event]:rounded-full
      [&_.fc_.fc-daygrid-block-event]:border
      [&_.fc_.fc-daygrid-block-event]:shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]
      [&_.fc_.fc-daygrid-block-event]:px-0
      [&_.fc_.fc-daygrid-block-event]:py-0
      [&_.fc_.fc-h-event_.fc-event-main]:h-full
      [&_.fc_.fc-event-main-frame]:h-full
      [&_.fc_.fc-daygrid-event-dot]:hidden
      [&_.fc_.fc-event]:cursor-pointer
      [&_.fc_.fc-event]:transition
      [&_.fc_.fc-event:hover]:brightness-102
      [&_.fc_.fc-event:hover]:shadow-[0_2px_8px_rgba(15,23,42,0.08)]
      [&_.fc_.line-lane-placeholder]:invisible
      [&_.fc_.line-lane-placeholder]:pointer-events-none
      [&_.fc_.fc-view-harness]:bg-white"
  >
    <FullCalendar ref="calendarRef" :options="previewAwareCalendarOptions">
      <template #dayHeaderContent="arg">
        <div class="flex items-center justify-center gap-2 text-[15px] font-semibold">
          <span :class="isTodayDate(arg.date) ? 'text-blue-700' : 'text-slate-700'">{{ arg.text }}</span>
          <span
            v-if="isTodayDate(arg.date)"
            class="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold leading-none text-white shadow-sm"
          >
            오늘
          </span>
        </div>
      </template>

      <template #eventContent="arg">
        <div class="flex h-full min-h-[22px] w-full items-center justify-between gap-3 overflow-hidden px-4 py-1.5 text-[13px] font-semibold leading-none">
          <span class="truncate">{{ arg.event.title }}</span>
          <span
            v-if="arg.event.extendedProps.plan?.planStatus"
            class="inline-flex shrink-0 items-center rounded-[10px] border bg-white/85 px-3 py-1 text-[12px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            :style="{
              borderColor: arg.borderColor,
              color: arg.textColor,
            }"
          >
            {{ statusLabels[arg.event.extendedProps.plan.planStatus] ?? arg.event.extendedProps.plan.planStatus }}
          </span>
        </div>
      </template>
    </FullCalendar>

    <div v-if="previewSegments.length > 0" class="pointer-events-none absolute inset-0 z-20">
      <div
        v-for="segment in previewSegments"
        :key="segment.id"
        class="absolute flex items-center justify-center overflow-hidden rounded-full border border-dashed px-3 text-center text-[12px] font-bold leading-none shadow-[0_4px_14px_rgba(15,23,42,0.16)]"
        :style="{
          left: `${segment.left}px`,
          top: `${segment.top}px`,
          width: `${segment.width}px`,
          height: `${segment.height}px`,
          backgroundColor: segment.backgroundColor,
          borderColor: segment.borderColor,
          color: segment.textColor,
          opacity: 0.72,
        }"
      >
        <span class="truncate">{{ segment.title }}</span>
      </div>
    </div>
  </div>
</template>
