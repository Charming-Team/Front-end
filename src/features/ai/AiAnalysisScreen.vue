<!--
  [Screen] AI 생산계획 분석 로딩 화면
  역할: AI 분석 진행 상태를 5단계로 시각화하고, 완료 시 /ai/result로 자동 이동합니다.
  API 연동 시: 실제 분석 진행률 및 단계 완료 여부를 polling 또는 WebSocket으로 수신할 예정입니다.
-->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const IS_STYLE_DEV = false // 스타일 개발 중에는 자동 이동 방지

const STEPS = [
  { number: 1, label: '데이터 수집' },
  { number: 2, label: '제약 조건 분석' },
  { number: 3, label: '계획 시뮬레이션' },
  { number: 4, label: '최적안 생성' },
  { number: 5, label: '결과 정리' },
]

const TASK_CARDS = [
  { title: '주문 분석', description: '주문 수량, 납기, 우선순위 확인', tone: 'bule1', icon: 'document' },
  { title: '재고 확인', description: '재고 가용량 및 수급 일정 검토', tone: 'blue2', icon: 'cube' },
  { title: '부하 계산', description: '라인별 부하 및 가동률 분석', tone: 'blue3', icon: 'pulse' },
  { title: '납기 우선순위 평가', description: '납기 조건 및 우선순위 평가', tone: 'blue4', icon: 'calendar' },
  { title: '최적화', description: '비용 및 자원 최적 배분', tone: 'blue5', icon: 'chart' },
]

const toneClassMap = {
  bule1: { iconWrap: 'bg-blue-100/50 text-blue-200' },
  blue2: { iconWrap: 'bg-blue-100/60 text-blue-300' },
  blue3: { iconWrap: 'bg-blue-100/70 text-blue-400' },
  blue4: { iconWrap: 'bg-blue-100/80 text-blue-500' },
  blue5: { iconWrap: 'bg-blue-100/90 text-blue-600' },
}

const COLOR = {
  loading: '#74b2f9',
  complete: '#3379c9',
}

const progressColor = computed(() =>
  isComplete.value ? COLOR.complete : COLOR.loading
)

const router = useRouter()

const completedSteps = ref(0)
const elapsedSeconds = ref(0)

let stepTimer = null
let timeTimer = null

const isComplete = computed(() => completedSteps.value >= 5)
const currentProgress = computed(() => Math.min(completedSteps.value * 20, 100))

const stepsState = computed(() =>
  STEPS.map(step => ({
    ...step,
    active: step.number <= completedSteps.value + 1,
    complete: step.number <= completedSteps.value,
  }))
)

const taskCardsState = computed(() =>
  TASK_CARDS.map((card, index) => ({
    ...card,
    status:
      index < completedSteps.value
        ? '완료'
        : index === completedSteps.value && !isComplete.value
          ? '진행중'
          : '대기',
  }))
)

function taskBorder(index) {
  if (isComplete.value) return 'border-slate-200'

  return completedSteps.value === index
    ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.08)]'
    : 'border-slate-200'
}

function taskCardMotionStyle(index) {
  if (isComplete.value) {
    return {
      '--task-flex': '1',
      '--task-scale': '1',
      '--task-opacity': '1',
      '--task-z-index': '1',
    }
  }

  if (completedSteps.value === index) {
    return {
      '--task-flex': '1.55',
      '--task-scale': '1.03',
      '--task-opacity': '1',
      '--task-z-index': '3',
    }
  }

  if (index < completedSteps.value) {
    return {
      '--task-flex': '0.9',
      '--task-scale': '0.98',
      '--task-opacity': '0.9',
      '--task-z-index': '1',
    }
  }

  return {
    '--task-flex': '0.82',
    '--task-scale': '0.96',
    '--task-opacity': '0.78',
    '--task-z-index': '1',
  }
}

const elapsedLabel = computed(() => `약 ${elapsedSeconds.value}초 경과`)

onMounted(() => {
  timeTimer = setInterval(() => {
    elapsedSeconds.value++
  }, 1000)

  stepTimer = setInterval(() => {
    if (completedSteps.value < 5) {
      completedSteps.value++

      if (completedSteps.value >= 5) {
        clearInterval(stepTimer)
        clearInterval(timeTimer)

        if (!IS_STYLE_DEV) {
          setTimeout(() => router.push('/ai/result'), 1500)
        }
      }
    }
  }, 5000)
})

onUnmounted(() => {
  clearInterval(stepTimer)
  clearInterval(timeTimer)
})

function cancelAnalysis() {
  clearInterval(stepTimer)
  clearInterval(timeTimer)
  router.push('/plan')
}

function iconPath(icon) {
  switch (icon) {
    case 'document':
      return 'M7 3h7l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h6m-6 4h6m-6 4h4'
    case 'cube':
      return 'm12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4m7 4 7-4M5 17l7-4 7 4'
    case 'pulse':
      return 'M3 12h4l2.5-5 4 10 2.5-5H21'
    case 'calendar':
      return 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z'
    case 'chart':
      return 'M6 20V10m6 10V4m6 16v-7'
    default:
      return ''
  }
}
</script>

<template>
  <AppCard>
    <div class="px-5 py-6 sm:px-6">
      <div class="mx-auto max-w-[1200px]">
        <div class="text-center">
          <span class="text-[20px] block font-extrabold tracking-[-0.03em] text-[var(--color-text-main)] sm:text-[30px]">
            {{ isComplete ? 'AI 생산 계획 생성 완료!' : 'AI 생산 계획 생성 중' }}
          </span>

          <p
            v-if="isComplete"
            class="mt-2 text-[10px] font-medium text-slate-800 sm:text-[14px]"
          >
            최적의 생산 계획이 성공적으로 생성되었습니다.
            주문, 자재, 라인 상태, 설비 가동률, 납기 조건을 모두 고려한 최적의 생산 계획을 확인하세요.
          </p>

          <p
            v-else
            class="mt-2 text-[10px] font-medium text-slate-600 sm:text-[14px]"
          >
            주문, 자재, 라인 상태, 설비 가동률, 납기 조건을 분석하여 최적 생산 계획을 생성하고 있습니다.
          </p>
        </div>

        <div class="mt-6 flex flex-col items-center">
          <div
            class="position-relative d-flex align-items-center justify-content-center"
            style="width: 170px; height: 170px;"
          >
            <div
              v-if="!isComplete"
              class="spinner-border position-absolute top-0 start-0 w-100 h-100"
              :style="{
                color: progressColor,
                borderWidth: '10px',
              }"
              role="status"
            >
            </div>

            <div
              v-else
              class="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
              :style="{
                border: `10px solid ${progressColor}`,
              }"
            />

            <div
              class="position-relative text-center"
              style="z-index: 1;"
            >
              <div
                class="fw-black lh-1"
                :style="{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: progressColor,
                }"
              >
                {{ currentProgress }}%
              </div>
            </div>
          </div>

          <p class="mt-4 text-[16px] font-bold tracking-[-0.02em] text-[var(--color-text-main)] sm:text-[18px]">
            {{ isComplete ? '생산 계획이 모두 완료되었습니다.' : '생산 계획을 분석하고 있습니다.' }}
          </p>
        </div>

        <div class="mt-6">
          <div class="d-flex align-items-center gap-3">
            <div
              class="progress flex-1"
              style="height: 8px; border-radius: 999px;"
            >
              <div
                class="progress-bar"
                role="progressbar"
                :style="{ width: `${currentProgress}%`, transition: 'width 0.5s ease', backgroundColor: progressColor }"
                :aria-valuenow="currentProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>

            <div class="shrink-0 text-[13px] font-bold text-slate-500 sm:text-[14px]">
              {{ currentProgress }}%
              <span class="text-[12px] font-semibold text-slate-400">
                ({{ elapsedLabel }})
              </span>
            </div>
          </div>
        </div>

        <div class="mt-6 flex flex-col gap-3 md:grid md:grid-cols-2 xl:flex xl:flex-row xl:items-stretch">
          <div
            v-for="(task, index) in taskCardsState"
            :key="task.title"
            class="ai-task-card flex flex-col rounded-[12px] border bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)] max-h-[220px] min-h-[220px]"
            :class="taskBorder(index)"
            :style="taskCardMotionStyle(index)"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :class="toneClassMap[task.tone].iconWrap"
              >
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.9"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path :d="iconPath(task.icon)" />
                </svg>
              </div>

              <div class="min-w-0 flex-1 gap-2">
                <span class="break-keep block text-[20px] font-bold leading-[1.35] tracking-[-0.01em] text-slate-900 sm:text-[25px]">
                  {{ task.title }}
                </span>

                <span class="mt-0.5 block break-keep text-[10px] font-medium leading-5 text-slate-800 sm:text-[13px]">
                  {{ task.description }}
                </span>
              </div>
            </div>

            <div class="mt-auto flex items-center gap-1.5 pt-3">
              <template v-if="task.status === '완료'">
                <span class="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-blue-400">
                  <svg
                    class="h-2.5 w-2.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    stroke-width="3.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
                <span class="text-[12px] font-bold text-blue-600">완료</span>
              </template>

              <template v-else-if="task.status === '진행중'">
                <svg
                  class="h-[18px] w-[18px] shrink-0 animate-spin text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-dasharray="2.5 5"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="text-[12px] font-bold text-blue-600">진행 중</span>
              </template>

              <template v-else>
                <span class="inline-block h-[18px] w-[18px] shrink-0 rounded-full border-2 border-slate-300" />
                <span class="text-[12px] font-bold text-slate-400">대기</span>
              </template>
            </div>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-slate-400 sm:text-[12px]">
          <svg
            class="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
          민감한 데이터는 안전하게 처리되며, AI 분석 결과는 저장되지 않습니다.
        </div>

        <div
          v-if="!isComplete"
          class="mt-6 flex justify-center"
        >
          <AppButton
            variant="primary"
            @click="cancelAnalysis"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6M9 9l6 6" />
            </svg>
            분석 취소
          </AppButton>
        </div>
      </div>
    </div>
  </AppCard>
</template>

<style scoped src="../../styles/style.css"></style>
<style scoped>
.ai-task-card {
  position: relative;
  z-index: var(--task-z-index);
  transform: scale(var(--task-scale));
  opacity: var(--task-opacity);
  transform-origin: center;
  transition:
    flex 700ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 700ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 500ms ease,
    box-shadow 500ms ease,
    border-color 500ms ease;
  will-change: flex, transform, opacity;
}

@media (min-width: 1280px) {
  .ai-task-card {
    flex: var(--task-flex) 1 0%;
    min-width: 0;
  }
}

@media (max-width: 1279px) {
  .ai-task-card {
    transform: none;
    opacity: 1;
  }
}
</style>