<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PlanFilterBar from '../../components/plan/PlanFilterBar.vue'
import MonthPlanCalendar from '../../components/calendar/MonthPlanCalendar.vue'
import WeekPlanCalendar from '../../components/calendar/WeekPlanCalendar.vue'
import { LINE_THEMES, FIXED_LINE_ORDER, PLAN_STATUS_LABELS } from './constants.js'

const props = defineProps({
  plans: { type: Array, default: () => [] },
  previewPlans: { type: Array, default: () => [] },
  lines: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  status: { type: String, default: '' },
  search: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hasFilters: { type: Boolean, default: false },
  selectedPlanId: { type: [Number, null], default: null },
  calendarEditing: { type: Boolean, default: false },
  calendarSaving: { type: Boolean, default: false },
  calendarSaveError: { type: String, default: '' },
})

const emit = defineEmits([
  'retry',
  'select-plan',
  'update:status',
  'update:search',
  'search',
  'status-change',
  'move-plan',
  'preview-plan-move',
  'clear-plan-move-preview',
  'enter-calendar-edit',
  'complete-calendar-edit',
  'open-bulk-upload',
])

const viewMode = ref('month')
const anchorDate = ref(new Date())
const currentRangeLabel = ref('')

function compareLineNames(left, right) {
  const leftIndex = FIXED_LINE_ORDER.indexOf(left)
  const rightIndex = FIXED_LINE_ORDER.indexOf(right)
  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) return 1
    if (rightIndex === -1) return -1
    return leftIndex - rightIndex
  }
  return left.localeCompare(right, 'en', { numeric: true, sensitivity: 'base' })
}

function toAllDayEnd(iso) {
  const date = new Date(iso)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1)
  return date
}

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

function startOfWeek(date) {
  const next = startOfDay(date)
  next.setDate(next.getDate() - next.getDay())
  return next
}

function endOfWeek(date) {
  return addDays(startOfWeek(date), 6)
}

function getVisibleDateRange() {
  if (viewMode.value === 'week') {
    return {
      start: addDays(startOfDay(anchorDate.value), -3),
      end: addDays(startOfDay(anchorDate.value), 3),
    }
  }

  const monthStart = new Date(anchorDate.value.getFullYear(), anchorDate.value.getMonth(), 1)
  const monthEnd = new Date(anchorDate.value.getFullYear(), anchorDate.value.getMonth() + 1, 0)
  return {
    start: startOfWeek(monthStart),
    end: endOfWeek(monthEnd),
  }
}

function getVisibleDates() {
  const { start, end } = getVisibleDateRange()
  const dates = []
  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date)
  }
  return dates
}

function planCoversDate(plan, date) {
  const day = startOfDay(date).getTime()
  return (
    startOfDay(plan.plannedStartAt).getTime() <= day &&
    startOfDay(plan.plannedEndAt).getTime() >= day
  )
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createPlanEvent(plan) {
  const theme = LINE_THEMES[plan.lineName] ?? {
    bg: '#EEF2F7', chip: '#E2E8F0', border: '#CBD5E1', text: '#475569',
  }
  const selected = plan.planId === props.selectedPlanId
  const lineOrder = orderedLineNames.value.indexOf(plan.lineName)
  return {
    id: String(plan.planId),
    title: plan.productName,
    start: plan.plannedStartAt,
    end: toAllDayEnd(plan.plannedEndAt),
    allDay: true,
    backgroundColor: theme.bg,
    borderColor: theme.border,
    textColor: theme.text,
    classNames: selected ? ['is-selected-plan'] : [],
    order: lineOrder === -1 ? 999 : lineOrder,
    extendedProps: {
      plan,
      lineName: plan.lineName,
      lineOrder: lineOrder === -1 ? 999 : lineOrder,
    },
  }
}

function createLinePlaceholderEvent(lineName, date) {
  const lineOrder = orderedLineNames.value.indexOf(lineName)
  return {
    id: `line-placeholder-${viewMode.value}-${toDateKey(date)}-${lineName}`,
    title: '',
    start: date,
    end: addDays(date, 1),
    allDay: true,
    editable: false,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: 'transparent',
    classNames: ['line-lane-placeholder'],
    order: lineOrder === -1 ? 999 : lineOrder,
    extendedProps: {
      isLinePlaceholder: true,
      lineName,
      lineOrder: lineOrder === -1 ? 999 : lineOrder,
    },
  }
}

const orderedLineNames = computed(() => {
  const names = new Set()
  props.lines.forEach(line => { if (line?.lineName) names.add(line.lineName) })
  props.plans.forEach(plan => { if (plan?.lineName) names.add(plan.lineName) })
  const dynamicNames = Array.from(names)
  const knownNames = FIXED_LINE_ORDER.filter(n => dynamicNames.includes(n))
  const unknownNames = dynamicNames.filter(n => !FIXED_LINE_ORDER.includes(n)).sort(compareLineNames)
  return [...knownNames, ...unknownNames]
})

const legendItems = computed(() =>
  orderedLineNames.value.map(lineName => ({
    lineName,
    color: (LINE_THEMES[lineName] ?? { bg: '#64748B', chip: '#E2E8F0' }).bg,
    chip: (LINE_THEMES[lineName] ?? { bg: '#64748B', chip: '#E2E8F0' }).chip,
  }))
)

const calendarEvents = computed(() =>
  {
    const planEvents = props.plans
    .slice()
    .sort((left, right) =>
      compareLineNames(left.lineName, right.lineName)
      || new Date(left.plannedStartAt) - new Date(right.plannedStartAt)
      || (left.planSequence ?? 0) - (right.planSequence ?? 0)
    )
    .map(createPlanEvent)

    const placeholderEvents = orderedLineNames.value.flatMap(lineName =>
      getVisibleDates()
        .filter(date => !props.plans.some(plan => plan.lineName === lineName && planCoversDate(plan, date)))
        .map(date => createLinePlaceholderEvent(lineName, date))
    )

    return [...planEvents, ...placeholderEvents]
  }
)

const previewCalendarEvents = computed(() =>
  props.previewPlans.map(plan => ({
    ...createPlanEvent(plan),
    id: `preview-${plan.planId}`,
    classNames: ['plan-move-preview'],
  }))
)

function prevRange() {
  const next = new Date(anchorDate.value)
  if (viewMode.value === 'week') {
    next.setDate(next.getDate() - 7)
  } else {
    next.setMonth(next.getMonth() - 1)
  }
  anchorDate.value = next
}

function nextRange() {
  const next = new Date(anchorDate.value)
  if (viewMode.value === 'week') {
    next.setDate(next.getDate() + 7)
  } else {
    next.setMonth(next.getMonth() + 1)
  }
  anchorDate.value = next
}

function goToday() {
  anchorDate.value = new Date()
}

function setViewMode(mode) {
  viewMode.value = mode
}
</script>

<template>
  <AppCard>
    <div class="px-5 py-5 sm:px-6">

      <!-- 1행: 필터(좌, flex-1) + 토글(우, 고정폭) — 범례를 분리해 필터바 최대 확보 -->
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0 flex-1">
          <PlanFilterBar
            :status-options="statusOptions"
            :status="status"
            :search="search"
            @update:status="emit('update:status', $event)"
            @update:search="emit('update:search', $event)"
            @search="emit('search')"
            @status-change="emit('status-change')"
          />
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <div class="inline-flex shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-sm">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-semibold transition"
              :class="viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'"
              @click="setViewMode('month')"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
              월별
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[14px] font-semibold transition"
              :class="viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'"
              @click="setViewMode('week')"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              주차별
            </button>
          </div>

          <RouterLink
            to="/ai/analysis"
            class="inline-flex items-center gap-0.5 rounded-[10px] bg-[var(--color-primary)] px-4 py-2 text-[14px] font-semibold text-white transition hover:brightness-110"
            style="text-decoration: none;"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/>
              <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/>
            </svg>
            AI 분석 시작
          </RouterLink>
        </div>
      </div>

      <!-- 2행: 범례(우측 정렬) -->
      <div class="mt-2 mb-3 flex flex-wrap items-center justify-end gap-2">
        <span
          v-for="item in legendItems"
          :key="item.lineName"
          class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-slate-700"
          :style="{ backgroundColor: item.chip, borderColor: `${item.color}33` }"
        >
          <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
          {{ item.lineName }}
        </span>
      </div>

      <!-- 로딩 -->
      <div
        v-if="loading"
        class="flex min-h-[360px] flex-col items-center justify-center gap-3 text-[15px] font-medium text-slate-500"
      >
        <div class="spinner-border text-primary" role="status" aria-label="로딩 중"></div>
        <span>데이터를 불러오는 중입니다...</span>
      </div>

      <!-- 에러 -->
      <div
        v-else-if="error"
        class="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center text-[15px] font-medium text-red-600"
      >
        <svg class="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ error }}</span>
        <AppButton variant="danger-outline" @click="emit('retry')">다시 시도</AppButton>
      </div>

      <!-- 데이터 없음 -->
      <div
        v-else-if="plans.length === 0"
        class="flex min-h-[360px] flex-col items-center justify-center gap-3 text-[15px] font-medium text-slate-500"
      >
        <svg class="h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <span>{{ hasFilters ? '검색 결과가 없습니다.' : '생산계획 데이터가 없습니다.' }}</span>
      </div>

      <!-- 네비게이션 + 캘린더 -->
      <template v-else>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <AppButton class="min-w-[42px]" variant="secondary" size="sm" @click="prevRange">‹</AppButton>
            <span class="min-w-[140px] text-center text-[15px] font-semibold text-slate-900">{{ currentRangeLabel }}</span>
            <AppButton class="min-w-[42px]" variant="secondary" size="sm" @click="nextRange">›</AppButton>
            <AppButton class="ml-1" variant="primary" size="sm" @click="goToday">오늘</AppButton>
          </div>

          <div class="flex items-center gap-2">
            <span v-if="calendarSaveError" class="text-[13px] font-semibold text-red-600">{{ calendarSaveError }}</span>
            <AppButton
              v-if="!calendarEditing"
              variant="secondary"
              size="sm"
              @click="emit('open-bulk-upload')"
            >
              일괄 등록
            </AppButton>
            <AppButton
              v-if="!calendarEditing"
              variant="secondary"
              size="sm"
              @click="emit('enter-calendar-edit')"
            >
              수정
            </AppButton>
            <AppButton
              v-else
              variant="primary"
              size="sm"
              :disabled="calendarSaving"
              @click="emit('complete-calendar-edit')"
            >
              {{ calendarSaving ? '저장 중...' : '완료' }}
            </AppButton>
          </div>
        </div>

        <MonthPlanCalendar
          v-if="viewMode === 'month'"
          :anchor-date="anchorDate"
          :events="calendarEvents"
          :preview-events="previewCalendarEvents"
          :editable="calendarEditing"
          @update-range-label="currentRangeLabel = $event"
          @select-plan="emit('select-plan', $event)"
          @move-plan="emit('move-plan', $event)"
          @preview-plan-move="emit('preview-plan-move', $event)"
          @clear-plan-move-preview="emit('clear-plan-move-preview')"
        />

        <WeekPlanCalendar
          v-else
          :anchor-date="anchorDate"
          :events="calendarEvents"
          :preview-events="previewCalendarEvents"
          :editable="calendarEditing"
          :status-labels="PLAN_STATUS_LABELS"
          @update-range-label="currentRangeLabel = $event"
          @select-plan="emit('select-plan', $event)"
          @move-plan="emit('move-plan', $event)"
          @preview-plan-move="emit('preview-plan-move', $event)"
          @clear-plan-move-preview="emit('clear-plan-move-preview')"
        />
      </template>

    </div>
  </AppCard>
</template>
