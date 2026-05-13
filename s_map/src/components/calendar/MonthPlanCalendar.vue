<script setup>
import { computed, ref, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid/index.js'
import interactionPlugin from '@fullcalendar/interaction/index.js'
import koLocale from '@fullcalendar/core/locales/ko.js'

const props = defineProps({
  anchorDate: { type: Date, required: true },
  events: { type: Array, default: () => [] },
})

const emit = defineEmits(['select-plan', 'update-range-label'])

const calendarRef = ref(null)

function getMonthLabel(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  locale: koLocale,
  initialView: 'dayGridMonth',
  initialDate: props.anchorDate,
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
    emit('update-range-label', getMonthLabel(value))
  },
  { immediate: true }
)
</script>

<template>
  <div
    class="month-plan-calendar
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
      [&_.fc_.fc-daygrid-day-top]:justify-end
      [&_.fc_.fc-daygrid-day-number]:px-2
      [&_.fc_.fc-daygrid-day-number]:py-2
      [&_.fc_.fc-daygrid-day-number]:text-sm
      [&_.fc_.fc-daygrid-day-number]:font-semibold
      [&_.fc_.fc-day-other_.fc-daygrid-day-number]:text-slate-300
      [&_.fc_.fc-day-today]:bg-blue-50/70
      [&_.fc_.fc-daygrid-day-frame]:min-h-[150px]
      [&_.fc_.fc-daygrid-day-events]:px-2
      [&_.fc_.fc-daygrid-event-harness]:px-1
      [&_.fc_.fc-daygrid-event-harness]:my-1
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
      <template #eventContent="arg">
        <div class="flex h-full min-h-[22px] w-full items-center justify-center overflow-hidden px-3 py-1.5 text-center text-[13px] font-semibold leading-none">
          <span class="truncate">{{ arg.event.title }}</span>
        </div>
      </template>
    </FullCalendar>
  </div>
</template>
