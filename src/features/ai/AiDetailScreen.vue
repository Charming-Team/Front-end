<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loadAiSimulationSession } from './simulationSession.js'

const route = useRoute()
const router = useRouter()
const session = ref(loadAiSimulationSession())

const options = computed(() => session.value.options ?? [])
const selectedVariantCode = computed(() => {
  const raw = Array.isArray(route.query.variant) ? route.query.variant[0] : route.query.variant
  return raw || session.value.selectedVariantCode || options.value[0]?.variantCode || ''
})
const option = computed(() =>
  options.value.find(item => item.variantCode === selectedVariantCode.value) ?? options.value[0] ?? null
)
const alternative = computed(() => option.value?.alternative ?? {})
const simulationMetrics = computed(() => alternative.value.simulation_metrics ?? alternative.value.simulationMetrics ?? {})
const computedDeltas = computed(() => alternative.value.computed_deltas ?? alternative.value.computedDeltas ?? {})
const baseline = computed(() => session.value.response?.simulation_response?.baseline ?? {})
const baselineMetrics = computed(() =>
  baseline.value.current_state_summary ?? baseline.value.simulation_metrics ?? {}
)
const comparisonRows = computed(() =>
  alternative.value.simulation_comparison_table ?? alternative.value.simulationComparisonTable ?? []
)
const conditions = computed(() =>
  alternative.value.application_conditions ?? alternative.value.applicationConditions ?? {}
)
const scheduleRows = computed(() =>
  alternative.value.selected_plan_change_schedule ?? alternative.value.selectedPlanChangeSchedule ?? []
)
const importantEvents = computed(() =>
  alternative.value.important_events ?? alternative.value.importantEvents ?? []
)
const aiEvaluation = computed(() => alternative.value.ai_evaluation ?? alternative.value.aiEvaluation ?? {})
const aiRecommendation = computed(() =>
  aiEvaluation.value.ai_recommendation ?? aiEvaluation.value.aiRecommendation ?? {}
)
const reviewState = computed(() =>
  option.value?.reviewState ?? { level: 'RECOMMENDED', label: '반영 가능', message: '' }
)
const canApplyOption = computed(() =>
  !['BLOCKED', 'NOT_RECOMMENDED', 'CAUTION'].includes(reviewState.value.level)
)
const applicationBlockMessage = computed(() =>
  reviewState.value.message || '이 대응안은 바로 반영할 수 없습니다.'
)
const riskInterpretation = computed(() =>
  aiEvaluation.value.risk_interpretation?.text
  ?? aiEvaluation.value.riskInterpretation?.text
  ?? 'AI 리스크 해석 데이터가 없습니다.'
)
const AI_EVALUATION_FALLBACK_TEXT = 'AI 평가 문구를 생성하지 못했습니다. 정량 지표를 기준으로 확인해주세요.'
const summaryText = computed(() => {
  if (!canApplyOption.value) {
    return applicationBlockMessage.value
  }

  const text = aiRecommendation.value.summary_text
    ?? aiRecommendation.value.summaryText
    ?? option.value?.summaryText
    ?? ''
  return isDisplayableAiText(text)
    ? text
    : '정량 지표와 변경 일정 기준으로 대응안을 확인해주세요.'
})
const recommendationReasons = computed(() => {
  if (!canApplyOption.value) return []

  const reasons = aiRecommendation.value.reasons ?? option.value?.reasons ?? []
  return Array.isArray(reasons) ? reasons.filter(isDisplayableAiText) : []
})

function pick(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return fallback
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatNumber(value, digits = 1) {
  const number = toNumber(value)
  if (number === null) return '-'
  return number.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

function formatPercent(value) {
  const number = toNumber(value)
  if (number === null) return '-'
  return `${formatNumber(number)}%`
}

function formatDays(value) {
  const number = toNumber(value)
  if (number === null) return '-'
  return `${formatNumber(number, 2)}일`
}

function formatCurrency(value) {
  const number = toNumber(value)
  if (number === null) return '-'
  if (Math.abs(number) >= 10000) return `${formatNumber(number / 10000, 1)}만원`
  return `${formatNumber(number, 0)}원`
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatVariantTitle(target = option.value) {
  if (!target) return 'AI 대안'
  if (target.variantName === 'Due-Date Optimal') return '납기 최적화 대안'
  if (target.variantName === 'Amount Optimal') return '금액 최적화 대안'
  return target.variantName || target.variantCode || 'AI 대안'
}

function isDisplayableAiText(value = '') {
  if (!value || value === AI_EVALUATION_FALLBACK_TEXT) return false
  return !/LLM output contains|not present in evidence|PlanningValidationError|Evaluation draft JSON schema is invalid|Final evaluation JSON schema is invalid|validation error for|Input should be|pydantic\.dev/i.test(String(value))
}

function metricValue(metrics, keys) {
  return pick(metrics, keys)
}

function formatChange(value, suffix = '') {
  const number = toNumber(value)
  if (number === null) return '-'
  const sign = number > 0 ? '+' : ''
  return `${sign}${formatNumber(number)}${suffix}`
}

function formatAmountSaving(value) {
  const number = toNumber(value)
  if (number === null) return '-'
  if (number === 0) return '변화 없음'
  return `${formatCurrency(Math.abs(number))} ${number > 0 ? '절감' : '증가'}`
}

function getDeltaClass(value, positiveIsGood = true) {
  const number = toNumber(value)
  if (number === null || number === 0) return 'text-slate-600'
  const improved = positiveIsGood ? number > 0 : number < 0
  return improved ? 'text-emerald-600' : 'text-red-600'
}

function formatTableValue(row, key) {
  const value = key === 'baseline_value'
    ? (row?.baseline_value ?? row?.baselineValue)
    : key === 'alternative_value'
      ? (row?.alternative_value ?? row?.alternativeValue)
      : row?.[key]
  const unit = row?.unit
  if (value === null || value === undefined || value === '') return '-'
  if (unit === 'percent_point' || unit === 'percent') return `${formatNumber(value)}%`
  if (unit === 'orders') return `${formatNumber(value, 0)}건`
  if (unit === 'minutes') return `${formatNumber(Number(value) / 1440, 2)}일`
  if (unit === 'days') return `${formatNumber(value, 2)}일`
  return formatNumber(value)
}

function getRowChangeClass(row) {
  const delta = toNumber(row?.delta)
  if (delta === null || delta === 0) return 'text-slate-500'
  return delta > 0 ? 'text-emerald-600' : 'text-red-600'
}

function getMetricDirectionClass(beforeValue, afterValue, lowerIsBetter = true) {
  const before = toNumber(beforeValue)
  const after = toNumber(afterValue)
  if (before === null || after === null || before === after) return 'text-slate-600'
  const improved = lowerIsBetter ? after < before : after > before
  return improved ? 'text-emerald-600' : 'text-red-600'
}

function getReviewBadgeClass() {
  if (reviewState.value.level === 'BLOCKED') return 'bg-red-100 text-red-700'
  if (reviewState.value.level === 'NOT_RECOMMENDED') return 'bg-orange-100 text-orange-700'
  if (reviewState.value.level === 'CAUTION') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function getName(item, nameKeys, idKeys) {
  const name = pick(item, nameKeys)
  if (name) return name
  const id = pick(item, idKeys)
  return id == null ? '-' : `#${id}`
}

function joinNames(items, nameKeys, idKeys) {
  if (!Array.isArray(items) || items.length === 0) return '-'
  const names = items.slice(0, 4).map(item => getName(item, nameKeys, idKeys))
  const suffix = items.length > names.length ? ` 외 ${items.length - names.length}건` : ''
  return `${names.join(', ')}${suffix}`
}

function periodText(period = {}) {
  const start = pick(period, ['start', 'planned_start_at', 'plannedStartAt'])
  const end = pick(period, ['end', 'planned_end_at', 'plannedEndAt'])
  if (!start && !end) return '-'
  return `${formatDateTime(start)} ~ ${formatDateTime(end)}`
}

function selectThisOption() {
  if (!option.value?.variantCode) {
    router.push('/plan')
    return
  }

  if (!canApplyOption.value) return

  router.push({
    path: '/plan',
    query: { aiVariant: option.value.variantCode },
  })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppCard v-if="!option">
      <div class="px-6 py-8 text-center">
        <h2 class="text-[18px] font-extrabold text-slate-900">상세 시뮬레이션 결과가 없습니다.</h2>
        <p class="mt-2 text-[13px] font-semibold text-slate-500">
          생산계획 화면에서 AI 분석을 먼저 실행해주세요.
        </p>
        <div class="mt-5">
          <AppButton variant="primary" @click="router.push('/plan')">생산계획으로 돌아가기</AppButton>
        </div>
      </div>
    </AppCard>

    <template v-else>
      <div>
        <AppButton variant="subtle" size="sm" @click="router.push('/ai/result')">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          대응안 목록으로 돌아가기
        </AppButton>
      </div>

      <AppCard>
        <div class="px-5 py-5 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <svg class="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 20V10m6 10V4m6 16v-7" />
                </svg>
              </div>
              <div>
                <h2 class="text-[18px] font-extrabold tracking-[-0.02em] text-slate-900">{{ formatVariantTitle() }}</h2>
                <p class="mt-1 text-[13px] font-medium text-slate-500">
                  {{ summaryText }}
                </p>
              </div>
            </div>
            <span
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold"
              :class="getReviewBadgeClass()"
            >
              {{ reviewState.label }}
            </span>
          </div>
          <p
            v-if="!canApplyOption"
            class="mt-4 rounded-[10px] border px-4 py-3 text-[13px] font-bold"
            :class="reviewState.level === 'BLOCKED'
              ? 'border-red-100 bg-red-50 text-red-700'
              : 'border-amber-100 bg-amber-50 text-amber-700'"
          >
            {{ applicationBlockMessage }}
          </p>

          <div class="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z"/></svg>
              </div>
              <div>
                <div class="text-[11px] font-semibold text-slate-500">예상 지연</div>
                <div class="text-[17px] font-extrabold text-slate-900">
                  {{ formatDays(metricValue(baselineMetrics, ['expected_delay_days', 'expectedDelayDays'])) }}
                  <span
                    :class="getMetricDirectionClass(
                      metricValue(baselineMetrics, ['expected_delay_days', 'expectedDelayDays']),
                      metricValue(simulationMetrics, ['expected_delay_days', 'expectedDelayDays']),
                      true
                    )"
                  >→ {{ formatDays(metricValue(simulationMetrics, ['expected_delay_days', 'expectedDelayDays'])) }}</span>
                </div>
                <div
                  class="text-[11px] font-bold"
                  :class="getDeltaClass(metricValue(computedDeltas, ['expected_delay_days_reduction', 'expectedDelayDaysReduction']))"
                >
                  {{ formatChange(metricValue(computedDeltas, ['expected_delay_days_reduction', 'expectedDelayDaysReduction']), '일') }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4"/></svg>
              </div>
              <div>
                <div class="text-[11px] font-semibold text-slate-500">지연 위험 주문</div>
                <div class="text-[17px] font-extrabold text-slate-900">
                  {{ formatNumber(metricValue(baselineMetrics, ['delay_risk_order_count', 'delayRiskOrderCount']), 0) }}건
                  <span
                    :class="getMetricDirectionClass(
                      metricValue(baselineMetrics, ['delay_risk_order_count', 'delayRiskOrderCount']),
                      metricValue(simulationMetrics, ['delay_risk_order_count', 'delayRiskOrderCount']),
                      true
                    )"
                  >→ {{ formatNumber(metricValue(simulationMetrics, ['delay_risk_order_count', 'delayRiskOrderCount']), 0) }}건</span>
                </div>
                <div
                  class="text-[11px] font-bold"
                  :class="getDeltaClass(metricValue(computedDeltas, ['delay_risk_order_reduction', 'delayRiskOrderReduction']))"
                >
                  {{ formatChange(metricValue(computedDeltas, ['delay_risk_order_reduction', 'delayRiskOrderReduction']), '건') }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <div>
                <div class="text-[11px] font-semibold text-slate-500">납기 충족률</div>
                <div class="text-[17px] font-extrabold text-slate-900">
                  {{ formatPercent(metricValue(baselineMetrics, ['delivery_fulfillment_rate_percent', 'deliveryFulfillmentRatePercent'])) }}
                  <span
                    :class="getMetricDirectionClass(
                      metricValue(baselineMetrics, ['delivery_fulfillment_rate_percent', 'deliveryFulfillmentRatePercent']),
                      metricValue(simulationMetrics, ['delivery_fulfillment_rate_percent', 'deliveryFulfillmentRatePercent']),
                      false
                    )"
                  >→ {{ formatPercent(metricValue(simulationMetrics, ['delivery_fulfillment_rate_percent', 'deliveryFulfillmentRatePercent'])) }}</span>
                </div>
                <div
                  class="text-[11px] font-bold"
                  :class="getDeltaClass(metricValue(computedDeltas, ['delivery_fulfillment_rate_delta_percent_points', 'deliveryFulfillmentRateDeltaPercentPoints']))"
                >
                  {{ formatChange(metricValue(computedDeltas, ['delivery_fulfillment_rate_delta_percent_points', 'deliveryFulfillmentRateDeltaPercentPoints']), '%p') }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div>
                <div class="text-[11px] font-semibold text-slate-500">위험 비용</div>
                <div class="text-[17px] font-extrabold text-slate-900">
                  {{ formatCurrency(metricValue(baselineMetrics, ['total_risk_cost', 'totalRiskCost'])) }}
                  <span
                    :class="getMetricDirectionClass(
                      metricValue(baselineMetrics, ['total_risk_cost', 'totalRiskCost']),
                      metricValue(simulationMetrics, ['total_risk_cost', 'totalRiskCost']),
                      true
                    )"
                  >→ {{ formatCurrency(metricValue(simulationMetrics, ['total_risk_cost', 'totalRiskCost'])) }}</span>
                </div>
                <div
                  class="text-[11px] font-bold"
                  :class="getDeltaClass(metricValue(computedDeltas, ['risk_cost_saving_amount', 'riskCostSavingAmount']))"
                >
                  {{ formatAmountSaving(metricValue(computedDeltas, ['risk_cost_saving_amount', 'riskCostSavingAmount'])) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AppCard>
          <div class="px-5 py-5">
            <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">적용 조건</h3>
            <ul class="flex flex-col gap-3">
              <li class="flex items-start gap-2">
                <span class="mt-0.5 h-4 w-4 rounded-full border-4 border-emerald-200 bg-emerald-500"></span>
                <span class="text-[13px] font-semibold text-slate-700">적용 라인</span>
                <span class="ml-auto max-w-[65%] text-right text-[13px] font-semibold text-slate-500">
                  {{ joinNames(conditions.available_lines, ['line_name', 'lineName', 'line_code', 'lineCode'], ['line_id', 'lineId']) }}
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 h-4 w-4 rounded-full border-4 border-emerald-200 bg-emerald-500"></span>
                <span class="text-[13px] font-semibold text-slate-700">대상 제품</span>
                <span class="ml-auto max-w-[65%] text-right text-[13px] font-semibold text-slate-500">
                  {{ joinNames(conditions.target_products, ['product_name', 'productName', 'product_code', 'productCode'], ['product_id', 'productId']) }}
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 h-4 w-4 rounded-full border-4 border-emerald-200 bg-emerald-500"></span>
                <span class="text-[13px] font-semibold text-slate-700">적용 기간</span>
                <span class="ml-auto max-w-[65%] text-right text-[13px] font-semibold text-slate-500">
                  {{ periodText(conditions.applicable_period ?? conditions.applicablePeriod) }}
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 h-4 w-4 rounded-full border-4 border-emerald-200 bg-emerald-500"></span>
                <span class="text-[13px] font-semibold text-slate-700">변경 일정</span>
                <span class="ml-auto text-[13px] font-semibold text-slate-500">{{ formatNumber(scheduleRows.length, 0) }}건</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="mt-0.5 h-4 w-4 rounded-full border-4 border-emerald-200 bg-emerald-500"></span>
                <span class="text-[13px] font-semibold text-slate-700">변경되지 않은 겹침 계획</span>
                <span class="ml-auto text-[13px] font-semibold text-slate-500">
                  {{ formatNumber((conditions.unchanged_overlapping_orders ?? conditions.unchangedOverlappingOrders ?? []).length, 0) }}건
                </span>
              </li>
            </ul>
          </div>
        </AppCard>

        <AppCard>
          <div class="px-5 py-5">
            <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">시뮬레이션 결과 비교</h3>
            <table class="w-full text-[13px]">
              <thead>
                <tr class="border-b border-slate-100">
                  <th class="pb-2 text-left font-semibold text-slate-500">항목</th>
                  <th class="pb-2 text-center font-semibold text-slate-500">기준 계획</th>
                  <th class="pb-2 text-center font-semibold text-slate-500">대응안 적용 후</th>
                  <th class="pb-2 text-center font-semibold text-slate-500">변화</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in comparisonRows" :key="row.metric_code ?? row.metricCode" class="border-b border-slate-50">
                  <td class="py-2.5 font-medium text-slate-700">{{ row.metric_name ?? row.metricName }}</td>
                  <td class="py-2.5 text-center font-medium text-slate-600">{{ formatTableValue(row, 'baseline_value') }}</td>
                  <td class="py-2.5 text-center font-semibold text-slate-900">{{ formatTableValue(row, 'alternative_value') }}</td>
                  <td class="py-2.5 text-center font-bold" :class="getRowChangeClass(row)">
                    {{ row.change_text ?? row.changeText ?? formatTableValue(row, 'delta') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AppCard>
          <div class="px-5 py-5">
            <h3 class="mb-1 text-[15px] font-extrabold text-slate-900">현재 상태 유지 시</h3>
            <p class="mb-4 text-[12px] font-medium text-slate-500">현재 DB 생산계획을 기준으로 산출된 baseline 시뮬레이션 결과입니다.</p>
            <div class="mb-4 flex flex-wrap gap-2">
              <span class="rounded-[6px] bg-red-100 px-3 py-1.5 text-[12px] font-bold text-red-700">
                예상 지연 <strong>{{ formatDays(metricValue(baselineMetrics, ['expected_delay_days', 'expectedDelayDays'])) }}</strong>
              </span>
              <span class="rounded-[6px] bg-amber-100 px-3 py-1.5 text-[12px] font-bold text-amber-700">
                납기 미달 <strong>{{ formatPercent(metricValue(baselineMetrics, ['delivery_miss_rate_percent', 'deliveryMissRatePercent'])) }}</strong>
              </span>
              <span class="rounded-[6px] bg-red-100 px-3 py-1.5 text-[12px] font-bold text-red-700">
                지연 위험 주문 <strong>{{ formatNumber(metricValue(baselineMetrics, ['delay_risk_order_count', 'delayRiskOrderCount']), 0) }}건</strong>
              </span>
              <span class="rounded-[6px] bg-emerald-100 px-3 py-1.5 text-[12px] font-bold text-emerald-700">
                평균 가동률 <strong>{{ formatPercent(metricValue(baselineMetrics, ['avg_line_utilization_percent', 'avgLineUtilizationPercent'])) }}</strong>
              </span>
            </div>
            <p class="mb-1 text-[13px] font-bold text-slate-700">리스크 분석</p>
            <p class="text-[12px] font-medium leading-5 text-slate-500">{{ riskInterpretation }}</p>
          </div>
        </AppCard>

        <AppCard>
          <div class="px-5 py-5">
            <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">주요 이벤트</h3>
            <div v-if="importantEvents.length === 0" class="rounded-[10px] bg-slate-50 px-4 py-5 text-center text-[13px] font-semibold text-slate-500">
              주요 이벤트가 없습니다.
            </div>
            <ul v-else class="space-y-2">
              <li
                v-for="(event, index) in importantEvents.slice(0, 5)"
                :key="index"
                class="rounded-[10px] border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div class="text-[13px] font-bold text-slate-800">
                  {{ event.event ?? event.title ?? event.event_type ?? '이벤트' }}
                </div>
                <div class="mt-1 text-[12px] font-medium text-slate-500">
                  발생 {{ formatNumber(event.occurrence_count ?? event.count ?? 0, 0) }}회 · {{ event.source ?? '-' }}
                </div>
              </li>
            </ul>
          </div>
        </AppCard>
      </div>

      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">선택 대응안 변경 일정</h3>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[860px] text-[12px]">
              <thead>
                <tr class="border-b border-slate-100">
                  <th class="pb-2 text-left font-semibold text-slate-500">주문 ID</th>
                  <th class="pb-2 text-left font-semibold text-slate-500">계획 ID</th>
                  <th class="pb-2 text-left font-semibold text-slate-500">생산 라인 변화</th>
                  <th class="pb-2 text-left font-semibold text-slate-500">변경 전 생산 스케줄</th>
                  <th class="pb-2 text-left font-semibold text-slate-500">변경 후 생산 스케줄</th>
                  <th class="pb-2 text-left font-semibold text-slate-500">지연 상태</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in scheduleRows" :key="`${row.plan_id ?? row.planId}-${index}`" class="border-b border-slate-50">
                  <td class="py-2.5 font-semibold text-slate-800">{{ row.order_id ?? row.orderId ?? '-' }}</td>
                  <td class="py-2.5 font-medium text-slate-600">{{ row.plan_id ?? row.planId ?? '-' }}</td>
                  <td class="py-2.5 font-medium text-slate-600">{{ row.line_change ?? row.lineChange ?? '-' }}</td>
                  <td class="py-2.5 font-medium text-slate-500">{{ row.before_schedule ?? row.beforeSchedule ?? '-' }}</td>
                  <td class="py-2.5 font-medium text-slate-800">{{ row.after_schedule ?? row.afterSchedule ?? '-' }}</td>
                  <td class="py-2.5 font-bold text-slate-700">{{ row.delay_status_change ?? row.delayStatusChange ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="flex items-start gap-3">
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg class="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
            </div>
            <div>
              <p class="text-[13px] font-bold text-slate-900">AI 종합 평가</p>
              <p class="mt-0.5 text-[12px] font-medium leading-5 text-slate-500">
                {{ summaryText }}
              </p>
              <ul v-if="recommendationReasons.length > 0" class="mt-2 list-disc space-y-1 pl-5 text-[12px] font-medium text-slate-500">
                <li v-for="reason in recommendationReasons.slice(0, 3)" :key="reason">{{ reason }}</li>
              </ul>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <AppButton variant="secondary" size="md" @click="router.push('/ai/result')">다른 대응안 비교하기</AppButton>
            <AppButton
              variant="primary"
              size="md"
              :disabled="!canApplyOption"
              @click="selectThisOption"
            >
              {{ canApplyOption ? '이 대응안 선택하기' : '반영할 수 없음' }}
            </AppButton>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>
