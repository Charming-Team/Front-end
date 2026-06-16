<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadAiSimulationSession } from './simulationSession.js'

const router = useRouter()
const session = ref(loadAiSimulationSession())

const TONES = ['blue']
const COLOR_MAP = {
  blue:   { badge: '#3379c9', stepBg: '#EEF4FF', stepText: '#3379c9' },
}

const options = computed(() => session.value.options ?? [])

const visibleOptions = computed(() => options.value.slice(0, 2))

const diagnosticMessage = computed(() => session.value.diagnosticMessage ?? '')
const simulationResponse = computed(() =>
  session.value.response?.simulation_response ?? session.value.response?.simulationResponse ?? {}
)
const baseline = computed(() => simulationResponse.value.baseline ?? {})
const baselineMetrics = computed(() =>
  baseline.value.current_state_summary
  ?? baseline.value.currentStateSummary
  ?? baseline.value.simulation_metrics
  ?? baseline.value.simulationMetrics
  ?? {}
)
const AI_EVALUATION_FALLBACK_TEXT = 'AI 평가 문구를 생성하지 못했습니다. 정량 지표를 기준으로 확인해주세요.'

function pick(source, keys, fallback = null) {
  for (const key of keys) {
    const value = source?.[key]
    if (value !== null && value !== undefined && value !== '') return value
  }
  return fallback
}

function formatNumber(value, digits = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return number.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

function formatVariantTitle(option = {}) {
  if (option.variantName === 'Due-Date Optimal') return '납기 최적화 대안'
  if (option.variantName === 'Amount Optimal') return '금액 최적화 대안'
  return option.variantName || option.variantCode || 'AI 대안'
}

function getOptionTone(index) {
  return TONES[index % TONES.length]
}

function getOptionIcon(index) {
  return ['calendar', 'chart', 'box', 'shield'][index % 4]
}

function getOptionDescription(option = {}) {
  const reviewState = getReviewState(option)
  if (reviewState.level !== 'RECOMMENDED') {
    return '정량 지표 기준으로 반영 여부를 검토해야 하는 대안입니다.'
  }

  return isDisplayableAiText(option.summaryText)
    ? option.summaryText
    : 'AI가 현재 생산계획과 제약 조건을 기준으로 생성한 대응안입니다.'
}

function isDisplayableAiText(value = '') {
  if (!value || value === AI_EVALUATION_FALLBACK_TEXT) return false
  return !/LLM output contains|not present in evidence|PlanningValidationError|Evaluation draft JSON schema is invalid|Final evaluation JSON schema is invalid|validation error for|Input should be|pydantic\.dev/i.test(String(value))
}

function getReviewState(option = {}) {
  return option.reviewState ?? { level: 'RECOMMENDED', label: '반영 가능', message: '' }
}

function getReviewBadgeClass(option = {}) {
  const level = getReviewState(option).level
  if (level === 'BLOCKED') return 'bg-red-100 text-red-700'
  if (level === 'NOT_RECOMMENDED') return 'bg-orange-100 text-orange-700'
  if (level === 'CAUTION') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}

function getPlanStatusText(option = {}) {
  const count = option.plans?.length ?? 0
  const unscheduledCount = option.unscheduledPlanIds?.length ?? 0
  const unscheduledText = unscheduledCount > 0 ? ` · 미배정 ${formatNumber(unscheduledCount, 0)}건` : ''
  return `${option.status || '-'} · 계획 ${formatNumber(count, 0)}건${unscheduledText}`
}

function getOptionSteps(option = {}) {
  const alternative = option.alternative ?? {}
  const metrics = alternative.simulation_metrics ?? alternative.simulationMetrics ?? {}
  const conditions = alternative.application_conditions ?? alternative.applicationConditions ?? {}
  const changes = alternative.selected_plan_change_schedule ?? alternative.selectedPlanChangeSchedule ?? []
  const reasons = Array.isArray(option.reasons) ? option.reasons : []

  const steps = [
    `변경 대상 계획 ${formatNumber(option.plans?.length ?? 0, 0)}건 확인`,
    `영향 라인 ${formatNumber(conditions.available_lines?.length ?? 0, 0)}개 검토`,
    `변경 일정 ${formatNumber(changes.length, 0)}건 비교`,
    `납기 충족률 ${formatNumber(metrics.delivery_fulfillment_rate_percent)}% 기준 평가`,
  ]

  if (getReviewState(option).level !== 'RECOMMENDED') return steps

  const displayableReasons = reasons.filter(isDisplayableAiText)
  return displayableReasons.length >= 4 ? displayableReasons.slice(0, 4) : steps
}

function openDetail(option) {
  router.push({
    path: '/ai/detail',
    query: { variant: option.variantCode },
  })
}

function keepCurrentPlan() {
  router.push('/plan')
}

function backToPlan() {
  router.push('/plan')
}

function iconPath(icon) {
  switch (icon) {
    case 'calendar': return 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z'
    case 'chart':    return 'M6 20V10m6 10V4m6 16v-7'
    case 'box':      return 'm12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4'
    case 'shield':   return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
    default:         return ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <AppCard v-if="options.length === 0">
      <div class="px-6 py-8 text-center">
        <h2 class="text-[18px] font-extrabold text-slate-900">AI 분석 결과가 없습니다.</h2>
        <p class="mt-2 text-[13px] font-semibold text-slate-500">
          생산계획 화면에서 충돌 일정에 대한 AI 분석을 먼저 실행해주세요.
        </p>
        <div class="mt-5">
          <AppButton variant="primary" @click="backToPlan">생산계획으로 돌아가기</AppButton>
        </div>
      </div>
    </AppCard>

    <template v-else>
      <AppCard v-if="!diagnosticMessage" class="overflow-hidden">
        <div class="flex flex-col items-center justify-center gap-1.5 bg-sky-50 px-5 py-4 text-center">
          <span class="text-[20px] font-extrabold text-slate-800">
            AI 생산계획 대안이 생성되었습니다.
          </span>
          <p class="text-[15px] font-semibold leading-5 text-slate-700">
            현재 계획 기준 지연 위험 {{ formatNumber(pick(baselineMetrics, [
              'delay_risk_order_count',
              'delayRiskOrderCount',
              'expected_delayed_orders',
              'expectedDelayedOrders',
              'delayed_orders_days',
              'delayedOrdersDays',
            ], 0), 0) }}건을 기준으로 비교합니다.
          </p>
        </div>
      </AppCard>

      <AppCard v-else-if="diagnosticMessage" class="overflow-hidden">
        <div class="flex flex-col items-center justify-center gap-1.5 bg-orange-50 px-5 py-4 text-center">
          <span class="text-[20px] font-extrabold text-slate-800">
            반영 가능한 대안이 없습니다.
          </span>
          <p class="text-[15px] font-semibold leading-5 text-slate-700">
            {{ diagnosticMessage }}
          </p>
        </div>
      </AppCard>

      <AppCard>
        <div class="px-5 py-4 sm:px-6">
          <div class="mb-1 border-l-4 border-[#1565C0] pl-3">
            <span class="text-[30px] font-bold tracking-[-0.02em] text-slate-900">대응안 목록 및 상세 내용</span>
          </div>
          <p class="mb-4 pl-3 text-[15px] font-medium text-slate-700">
            기존안을 유지하거나 AI가 생성한 대응안을 선택해 상세 시뮬레이션 결과를 확인하세요.
          </p>

          <div class="ai-result-options flex flex-col gap-4 xl:flex-row xl:items-stretch">
            <div
              class="ai-result-option-card"
              role="button"
              tabindex="0"
              @click="keepCurrentPlan"
              @keydown.enter.prevent="keepCurrentPlan"
            >
              <AppCard class="h-full cursor-pointer">
                <div class="relative flex min-h-[220px] flex-col px-5 py-4">
                  <span class="absolute left-3 top-3 flex h-6 min-w-12 items-center justify-center rounded-full bg-slate-500 px-2 text-[11px] font-bold text-white">
                    기존
                  </span>

                  <div class="mt-2 flex flex-col items-center gap-1.5">
                    <span class="mb-1 block text-center text-[25px] font-extrabold text-slate-700">
                      기존안 유지
                    </span>
                    <div class="mb-2 flex flex-wrap justify-center gap-2">
                      <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">
                        변경 없음
                      </span>
                      <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        API 호출 없음
                      </span>
                    </div>
                    <p class="mb-3 text-center text-[11px] font-medium leading-[1.5] text-slate-500">
                      새로운 계획을 적용하지 않고 현재 생산계획 상태를 유지합니다.
                    </p>
                  </div>

                  <div class="mt-auto">
                    <div
                      v-for="(step, stepIndex) in [
                        '현재 생산계획 유지',
                        '일정 변경 및 저장 없음',
                        'AI 대안 반영 API 호출 없음',
                        '필요 시 생산계획 화면에서 다시 조정'
                      ]"
                      :key="step"
                      class="flex flex-col"
                    >
                      <div class="flex items-start gap-2">
                        <span class="inline-flex w-[46px] shrink-0 items-center justify-center rounded-[4px] bg-slate-100 py-0.5 text-[10px] font-bold text-slate-600">
                          STEP {{ stepIndex + 1 }}
                        </span>
                        <span class="line-clamp-1 text-[11px] font-medium text-slate-700">{{ step }}</span>
                      </div>
                      <div
                        v-if="stepIndex < 3"
                        class="ml-[22px] h-2.5 w-px bg-slate-300"
                      ></div>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>

            <div
              v-for="(option, index) in visibleOptions"
              :key="option.variantCode || index"
              class="ai-result-option-card"
              role="button"
              tabindex="0"
              @click="openDetail(option)"
              @keydown.enter.prevent="openDetail(option)"
            >
              <AppCard class="h-full cursor-pointer">
                <div class="relative flex min-h-[220px] flex-col px-5 py-4">
                  <span
                    class="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    :style="{ backgroundColor: COLOR_MAP[getOptionTone(index)].badge }"
                  >{{ index + 1 }}</span>

                  <div class="mt-2 flex flex-col items-center gap-1.5">
                    <span
                      class="mb-1 block text-center text-[25px] font-extrabold"
                      :style="{ color: COLOR_MAP[getOptionTone(index)].badge }"
                    >{{ formatVariantTitle(option) }}</span>
                    <div class="mb-2 flex flex-wrap justify-center gap-2">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                        :class="getReviewBadgeClass(option)"
                      >
                        {{ getReviewState(option).label }}
                      </span>
                      <span class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                        {{ getPlanStatusText(option) }}
                      </span>
                    </div>
                    <p class="mb-3 text-center text-[11px] font-medium leading-[1.5] text-slate-500">
                      {{ getOptionDescription(option) }}
                    </p>
                    <p
                      v-if="getReviewState(option).message"
                      class="mb-3 rounded-[8px] px-3 py-2 text-center text-[11px] font-bold"
                      :class="getReviewState(option).level === 'BLOCKED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'"
                    >
                      {{ getReviewState(option).message }}
                    </p>
                  </div>

                  <div class="mt-auto">
                    <div v-for="(step, stepIndex) in getOptionSteps(option)" :key="stepIndex" class="flex flex-col">
                      <div class="flex items-start gap-2">
                        <span
                          class="inline-flex w-[46px] shrink-0 items-center justify-center rounded-[4px] py-0.5 text-[10px] font-bold"
                          :style="{
                            backgroundColor: COLOR_MAP[getOptionTone(index)].stepBg,
                            color: COLOR_MAP[getOptionTone(index)].stepText
                          }"
                        >STEP {{ stepIndex + 1 }}</span>
                        <span class="line-clamp-1 text-[11px] font-medium text-slate-700">{{ step }}</span>
                      </div>
                      <div
                        v-if="stepIndex < getOptionSteps(option).length - 1"
                        class="ml-[22px] h-2.5 w-px"
                        :style="{ backgroundColor: COLOR_MAP[getOptionTone(index)].stepText, opacity: 0.25 }"
                      ></div>
                    </div>
                  </div>
                </div>
              </AppCard>
            </div>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<style scoped>
.ai-result-options {
  align-items: stretch;
}

.ai-result-option-card {
  min-width: 0;
  flex: 1 1 0%;
  transform: scale(1);
  opacity: 1;
  transform-origin: center;
  transition:
    flex 700ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms ease;
  will-change: flex, transform, opacity;
}

.ai-result-options:hover .ai-result-option-card {
  flex: 0.82 1 0%;
  opacity: 0.82;
  transform: scale(0.985);
}

.ai-result-options:hover .ai-result-option-card:hover {
  z-index: 3;
  flex: 1.55 1 0%;
  opacity: 1;
  transform: scale(1.015);
}

.ai-result-options:focus-within .ai-result-option-card {
  flex: 0.82 1 0%;
  opacity: 0.82;
  transform: scale(0.985);
}

.ai-result-options:focus-within .ai-result-option-card:focus-within {
  z-index: 3;
  flex: 1.55 1 0%;
  opacity: 1;
  transform: scale(1.015);
}

@media (max-width: 1279px) {
  .ai-result-option-card,
  .ai-result-options:hover .ai-result-option-card,
  .ai-result-options:hover .ai-result-option-card:hover,
  .ai-result-options:focus-within .ai-result-option-card,
  .ai-result-options:focus-within .ai-result-option-card:focus-within {
    flex: 1 1 auto;
    opacity: 1;
    transform: none;
  }
}
</style>