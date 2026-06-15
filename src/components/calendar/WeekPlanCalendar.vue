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
  lineRows: { type: Array, default: () => [] },
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
const fixedSegments = ref([])
const draggingEvent = ref(null)
const lastPreviewKey = ref('')
const BLOCKED_MOVE_STATUSES = ['COMPLETED', 'CANCELLED']
const DAY_IN_MS = 86_400_000
const LANE_HEIGHT = 40
const BAR_HEIGHT = 28
const BAR_TOP_OFFSET = (LANE_HEIGHT - BAR_HEIGHT) / 2

const laneCount = computed(() => {
  const maxEventLineOrder = [...props.events, ...props.previewEvents].reduce((max, event) => {
    const lineOrder = Number(event.extendedProps?.lineOrder)
    return Number.isFinite(lineOrder) ? Math.max(max, lineOrder + 1) : max
  }, 0)
  return Math.max(6, props.lineRows.length, maxEventLineOrder)
})

const calendarStyle = computed(() => ({
  '--plan-lane-count': String(laneCount.value),
  '--plan-lane-height': `${LANE_HEIGHT}px`,
  '--plan-bar-height': `${BAR_HEIGHT}px`,
}))

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

function getEventTheme(event) {
  return event.extendedProps?.theme ?? {}
}

function getEventPlan(event) {
  return event.extendedProps?.plan
}

function isEventMovable(event) {
  const plan = getEventPlan(event)
  return props.editable && plan && !BLOCKED_MOVE_STATUSES.includes(plan.planStatus)
}

function getDateKeyAtPoint(clientX, clientY) {
  const root = rootRef.value
  if (!root) return null

  const cells = Array.from(root.querySelectorAll('.fc-daygrid-day[data-date]'))
  const cell = cells.find(item => {
    const rect = item.getBoundingClientRect()
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  })

  return cell?.dataset.date ?? null
}

function getDeltaDays(event, dateKey) {
  const plan = getEventPlan(event)
  if (!plan || !dateKey) return null

  const newStart = startOfDay(new Date(`${dateKey}T00:00:00`))
  const originalStart = startOfDay(plan.plannedStartAt)
  return Math.round((newStart - originalStart) / DAY_IN_MS)
}

function emitPlanMoveByDateKey(event, dateKey) {
  const plan = getEventPlan(event)
  const deltaDays = getDeltaDays(event, dateKey)
  if (!plan || deltaDays === null) return

  emit('move-plan', {
    planId: plan.planId,
    deltaDays,
    revert: () => {},
  })
}

function handleSegmentClick(segment) {
  if (segment.plan) emit('select-plan', segment.plan)
}

function handleSegmentDragStart(segment, browserEvent) {
  if (!segment.movable) {
    browserEvent.preventDefault()
    return
  }

  draggingEvent.value = segment.event
  lastPreviewKey.value = ''
  emit('clear-plan-move-preview')
  browserEvent.dataTransfer.effectAllowed = 'move'
  browserEvent.dataTransfer.setData('text/plain', String(segment.plan.planId))
}

function handleSegmentDragOver(browserEvent) {
  if (!draggingEvent.value) return

  const dateKey = getDateKeyAtPoint(browserEvent.clientX, browserEvent.clientY)
  const plan = getEventPlan(draggingEvent.value)
  const deltaDays = getDeltaDays(draggingEvent.value, dateKey)
  if (!plan || deltaDays === null) return

  const previewKey = `${plan.planId}:${deltaDays}`
  if (previewKey === lastPreviewKey.value) return

  lastPreviewKey.value = previewKey
  emit('preview-plan-move', { planId: plan.planId, deltaDays })
}

function handleSegmentDrop(browserEvent) {
  if (!draggingEvent.value) return

  const event = draggingEvent.value
  const dateKey = getDateKeyAtPoint(browserEvent.clientX, browserEvent.clientY)
  draggingEvent.value = null
  lastPreviewKey.value = ''
  emit('clear-plan-move-preview')

  if (dateKey) emitPlanMoveByDateKey(event, dateKey)
}

function handleSegmentDragEnd() {
  draggingEvent.value = null
  lastPreviewKey.value = ''
  emit('clear-plan-move-preview')
}

function buildFixedSegments() {
  nextTick(() => {
    const root = rootRef.value
    if (!root) {
      fixedSegments.value = []
      return
    }

    const rootRect = root.getBoundingClientRect()
    const segments = []
    const renderEvents = [
      ...props.events.map(event => ({ event, isPreview: false })),
      ...props.previewEvents.map(event => ({ event, isPreview: true })),
    ]

    renderEvents.forEach(({ event, isPreview }) => {
      const plan = event.extendedProps.plan
      if (!plan) return
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
        const theme = getEventTheme(event)
        segments.push({
          id: `${isPreview ? 'preview' : 'plan'}-${event.id}-${Math.round(row.top)}`,
          title: event.title,
          left: first.rect.left - rootRect.left + 6,
          top: eventsArea.top - rootRect.top + (lineOrder * LANE_HEIGHT) + BAR_TOP_OFFSET,
          width: last.rect.right - first.rect.left - 12,
          height: BAR_HEIGHT,
          backgroundColor: event.backgroundColor || theme.bg,
          borderColor: event.borderColor || theme.border,
          textColor: event.textColor || theme.text,
          statusLabel: props.statusLabels[plan.planStatus] ?? plan.planStatus,
          isPreview,
          selected: event.classNames?.includes('is-selected-plan') ?? false,
          movable: !isPreview && isEventMovable(event),
          event,
          plan,
        })
      })
    })

    fixedSegments.value = segments
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
  editable: false,
  selectable: false,
  eventStartEditable: false,
  eventDurationEditable: false,
  dayMaxEvents: false,
  dayMaxEventRows: false,
  eventMinHeight: 24,
  eventShortHeight: 24,
  displayEventTime: false,
  showNonCurrentDates: true,
  eventDisplay: 'block',
  eventOrder: 'order,start,-duration,title',
  eventOrderStrict: true,
  events: [],
}))

watch(
  () => props.anchorDate,
  value => {
    const api = calendarRef.value?.getApi()
    if (!api) return
    api.gotoDate(value)
    buildFixedSegments()
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
  () => [props.events, props.previewEvents],
  buildFixedSegments,
  { deep: true, flush: 'post' }
)

onMounted(() => {
  buildFixedSegments()
  window.addEventListener('resize', buildFixedSegments)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', buildFixedSegments)
})
</script>

<template>
  <div
    ref="rootRef"
    :style="calendarStyle"
    @dragover.prevent="handleSegmentDragOver"
    @drop.prevent="handleSegmentDrop"
    class="week-plan-calendar
      relative
      overflow-hidden
      rounded-2xl
      border
      border-slate-300
      bg-white
      shadow-md
      [&_.fc]:font-sans
      [&_.fc]:text-slate-900
      [&_.fc-theme-standard_.fc-scrollgrid]:border-0
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
      [&_.fc_.fc-daygrid-day-events]:px-2
      [&_.fc_.fc-daygrid-event-harness]:px-1
      [&_.fc_.fc-daygrid-block-event]:px-0
      [&_.fc_.fc-daygrid-block-event]:py-0
      [&_.fc_.fc-h-event_.fc-event-main]:h-full
      [&_.fc_.fc-event-main-frame]:h-full
      [&_.fc_.fc-daygrid-event-dot]:hidden
      [&_.fc_.fc-event]:cursor-pointer
      [&_.fc_.fc-event]:transition
      [&_.fc_.fc-event:hover]:brightness-102
      [&_.fc_.fc-view-harness]:bg-white"
  >
    <FullCalendar ref="calendarRef" :options="calendarOptions">
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
    </FullCalendar>

    <div v-if="fixedSegments.length > 0" class="pointer-events-none absolute inset-0 z-20">
      <div
        v-for="segment in fixedSegments"
        :key="segment.id"
        role="button"
        tabindex="0"
        :draggable="segment.movable"
        class="fixed-plan-segment pointer-events-auto absolute flex items-center justify-between gap-3 overflow-hidden rounded-full border px-4 text-[12px] font-bold leading-none shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
        :class="{
          'cursor-grab active:cursor-grabbing': segment.movable,
          'cursor-pointer': !segment.movable,
          'is-preview': segment.isPreview,
          'is-selected': segment.selected,
        }"
        :style="{
          left: `${segment.left}px`,
          top: `${segment.top}px`,
          width: `${segment.width}px`,
          height: `${segment.height}px`,
          backgroundColor: segment.backgroundColor,
          borderColor: segment.borderColor,
          color: segment.textColor,
          opacity: segment.isPreview ? 0.72 : 1,
        }"
        @click.stop="handleSegmentClick(segment)"
        @keydown.enter.prevent="handleSegmentClick(segment)"
        @dragstart="handleSegmentDragStart(segment, $event)"
        @dragend="handleSegmentDragEnd"
      >
        <span class="truncate">{{ segment.title }}</span>
        <span
          v-if="segment.statusLabel"
          class="inline-flex shrink-0 items-center rounded-[10px] border bg-white/85 px-3 py-1 text-[11px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
          :style="{
            borderColor: segment.borderColor,
            color: segment.textColor,
          }"
        >
          {{ segment.statusLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-plan-calendar :deep(.fc a) {
  color: inherit;
  text-decoration: none;
}

.week-plan-calendar :deep(.fc a:hover),
.week-plan-calendar :deep(.fc a:focus),
.week-plan-calendar :deep(.fc a:active) {
  color: inherit;
  text-decoration: none;
}

.week-plan-calendar :deep(.fc-col-header-cell-cushion) {
  color: #0f172a;
  font-weight: 600;
  text-decoration: none;
}

.week-plan-calendar :deep(.fc-daygrid-day-number) {
  color: #0f172a;
  font-weight: 600;
  text-decoration: none;
}

.week-plan-calendar :deep(.fc-day-other .fc-daygrid-day-number) {
  color: #cbd5e1;
}

.week-plan-calendar :deep(.fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion) {
  color: #1d4ed8;
}

.week-plan-calendar :deep(.fc-day-today .fc-daygrid-day-number) {
  color: #1d4ed8;
}

.week-plan-calendar :deep(.fc-daygrid-day-events) {
  box-sizing: content-box;
  min-height: calc(var(--plan-lane-count) * var(--plan-lane-height));
  padding-top: 0;
  background:
    repeating-linear-gradient(
      to bottom,
      transparent 0,
      transparent calc(var(--plan-lane-height) - 1px),
      rgba(148, 163, 184, 0.22) calc(var(--plan-lane-height) - 1px),
      rgba(148, 163, 184, 0.22) var(--plan-lane-height)
    );
}

.week-plan-calendar :deep(.fc-daygrid-day-frame) {
  min-height: calc((var(--plan-lane-count) * var(--plan-lane-height)) + 50px) !important;
}

.week-plan-calendar :deep(.fc-daygrid-event-harness) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.week-plan-calendar :deep(.fc-daygrid-event) {
  height: 36px;
  margin-top: 0 !important;
  padding-bottom: 10px !important;
  border-color: transparent !important;
  background: transparent !important;
  box-shadow: none !important;
}

.week-plan-calendar :deep(.fc-daygrid-event .fc-event-main),
.week-plan-calendar :deep(.fc-daygrid-event .fc-event-main-frame),
.week-plan-calendar :deep(.plan-event-chip) {
  height: 26px;
  min-height: 26px;
}

.week-plan-calendar :deep(.fc-event.is-selected-plan .plan-event-chip) {
  box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
</style>
