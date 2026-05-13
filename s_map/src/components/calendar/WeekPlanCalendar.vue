<script setup>
import { computed, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid/index.js'
import interactionPlugin from '@fullcalendar/interaction/index.js'
import koLocale from '@fullcalendar/core/locales/ko.js'
import { PLAN_STATUS_LABELS } from '../../features/plan/constants.js'

const props = defineProps({
  anchorDate: { type: Date, required: true },
  events: { type: Array, default: () => [] },
})

const emit = defineEmits(['select-plan', 'update-range-label'])

const calendarRef = ref(null)

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
  dayMaxEventRows: 6,
  displayEventTime: false,
  showNonCurrentDates: true,
  eventDisplay: 'block',
  eventOrder: 'order,start,-duration,title',
  eventOrderStrict: true,
  events: props.events,
  eventClick: info => {
    const plan = info.event.extendedProps.plan
    if (plan) emit('select-plan', plan)
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
</script>

<template>
  <div
    class="week-plan-calendar
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
            {{ PLAN_STATUS_LABELS[arg.event.extendedProps.plan.planStatus] ?? arg.event.extendedProps.plan.planStatus }}
          </span>
        </div>
      </template>
    </FullCalendar>
  </div>
</template>
