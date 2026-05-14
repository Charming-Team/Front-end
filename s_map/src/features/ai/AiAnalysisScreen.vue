<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const STEPS = [
  { number: 1, label: '데이터 수집' },
  { number: 2, label: '제약 조건 분석' },
  { number: 3, label: '계획 시뮬레이션' },
  { number: 4, label: '최적안 생성' },
  { number: 5, label: '결과 정리' },
]

const TASK_CARDS = [
  { title: '주문 정보 분석',    description: '주문 수량, 납기, 우선순위 확인',    tone: 'green',  icon: 'document' },
  { title: '자재 재고 확인',    description: '재고 가용량 및 수급 일정 검토',    tone: 'blue',   icon: 'cube'     },
  { title: '라인 부하 계산',    description: '라인별 부하 및 가동률 분석',       tone: 'violet', icon: 'pulse'    },
  { title: '납기 우선순위 평가', description: '납기 조건 및 우선순위 평가',       tone: 'amber',  icon: 'calendar' },
  { title: '생산량 최적화',     description: '생산량 및 자원 최적 배분',         tone: 'rose',   icon: 'chart'    },
]

const toneClassMap = {
  green:  { iconWrap: 'bg-emerald-100/80 text-emerald-600' },
  blue:   { iconWrap: 'bg-blue-100/80 text-blue-600'       },
  violet: { iconWrap: 'bg-violet-100/80 text-violet-600'   },
  amber:  { iconWrap: 'bg-amber-100/80 text-amber-600'     },
  rose:   { iconWrap: 'bg-rose-100/80 text-rose-600'       },
}

const router = useRouter()

const completedSteps = ref(0)
const elapsedSeconds = ref(0)

let stepTimer = null
let timeTimer = null

const isComplete = computed(() => completedSteps.value >= 5)
const currentProgress = computed(() => Math.min(completedSteps.value * 20, 100))

const stepsState = computed(() =>
  STEPS.map(s => ({
    ...s,
    active:   s.number <= completedSteps.value + 1,
    complete: s.number <= completedSteps.value,
  }))
)

const taskCardsState = computed(() =>
  TASK_CARDS.map((card, i) => ({
    ...card,
    status: i < completedSteps.value ? '완료'
          : i === completedSteps.value && !isComplete.value ? '진행중'
          : '대기',
  }))
)

function taskBorder(index) {
  if (isComplete.value) return 'border-slate-200'
  return completedSteps.value === index
    ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.08)]'
    : 'border-slate-200'
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
    case 'document':  return 'M7 3h7l3 3v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm2 5h6m-6 4h6m-6 4h4'
    case 'cube':      return 'm12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4m7 4 7-4M5 17l7-4 7 4'
    case 'pulse':     return 'M3 12h4l2.5-5 4 10 2.5-5H21'
    case 'calendar':  return 'M7 3v3M17 3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z'
    case 'chart':     return 'M6 20V10m6 10V4m6 16v-7'
    default:          return ''
  }
}
</script>

<template>
  <AppCard>
    <div class="px-5 py-6 sm:px-6">
      <div class="mx-auto max-w-[1240px]">

        <!-- Step indicator -->
        <div class="mb-6 grid grid-cols-5 gap-4">
          <div
            v-for="step in stepsState"
            :key="step.number"
            class="relative"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                :class="step.active
                  ? (isComplete ? 'text-white bg-success' : 'bg-blue-600 text-white')
                  : 'bg-slate-100 text-slate-500'"
              >
                {{ step.number }}
              </div>
              <span
                class="text-[13px] font-semibold"
                :class="step.active ? 'text-slate-900' : 'text-slate-400'"
              >
                {{ step.label }}
              </span>
            </div>

            <!-- Connector line (all steps; last step ends at cell right edge) -->
            <div
              class="absolute top-[44px] h-[2px]"
              :class="[
                step.complete && !isComplete ? 'bg-blue-600' : (!step.complete ? 'bg-slate-200' : ''),
                step.number < stepsState.length ? 'left-[18px] right-[-34px]' : 'left-[18px] right-0',
              ]"
              :style="step.complete && isComplete ? { backgroundColor: 'var(--bs-success)' } : {}"
            >
              <span
                v-if="step.number < stepsState.length"
                class="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                :class="step.complete && !isComplete ? 'bg-blue-600' : (!step.complete ? 'bg-slate-200' : '')"
                :style="step.complete && isComplete ? { backgroundColor: 'var(--bs-success)' } : {}"
              ></span>
            </div>
          </div>
        </div>

        <!-- Title + description -->
        <div class="text-center">
          <h2 class="text-[20px] font-extrabold tracking-[-0.03em] text-[var(--color-text-main)] sm:text-[22px]">
            {{ isComplete ? 'AI 생산 계획 생성 완료!' : 'AI 생산 계획 생성 중' }}
          </h2>
          <p v-if="isComplete" class="mt-2 text-[13px] font-medium text-slate-500 sm:text-[14px]">
            최적의 생산 계획이 성공적으로 생성되었습니다.<br>
            주문, 자재, 라인 상태, 설비 가동률, 납기 조건을 모두 고려한 최적의 생산 계획을 확인하세요.
          </p>
          <p v-else class="mt-2 text-[13px] font-medium text-slate-500 sm:text-[14px]">
            주문, 자재, 라인 상태, 설비 가동률, 납기 조건을 분석하여 최적 생산 계획을 생성하고 있습니다.
          </p>
        </div>

        <!-- Progress circle -->
        <div class="mt-6 flex flex-col items-center">
          <div class="position-relative d-flex align-items-center justify-content-center" style="width: 170px; height: 170px;">
            <!-- In-progress: Bootstrap spinning border -->
            <div
              v-if="!isComplete"
              class="spinner-border position-absolute top-0 start-0 w-100 h-100"
              :class="isComplete ? 'text-success' : 'text-primary'"
              style="border-width: 10px;"
              role="status"
            >
              <span class="visually-hidden">로딩 중</span>
            </div>
            <!-- Complete: static green ring -->
            <div
              v-else
              class="position-absolute top-0 start-0 w-100 h-100 rounded-circle"
              style="border: 10px solid var(--bs-success);"
            ></div>
            <!-- Center text -->
            <div class="position-relative text-center" style="z-index: 1;">
              <div
                class="fw-black lh-1"
                style="font-size: 36px;"
                :class="isComplete ? 'text-success' : 'text-primary'"
              >{{ currentProgress }}%</div>
              <div
                class="fw-semibold mt-1"
                style="font-size: 13px;"
                :class="isComplete ? 'text-success' : 'text-secondary'"
              >{{ isComplete ? '완료' : '진행 중' }}</div>
            </div>
          </div>

          <p class="mt-4 text-[16px] font-bold tracking-[-0.02em] text-[var(--color-text-main)] sm:text-[18px]">
            {{ isComplete ? '생산 계획이 모두 완료되었습니다.' : '생산 계획을 계산하고 있습니다...' }}
          </p>
        </div>

        <!-- Progress bar -->
        <div class="mt-6">
          <div class="d-flex align-items-center gap-3">
            <div class="progress flex-1" style="height: 8px; border-radius: 999px;">
              <div
                class="progress-bar"
                role="progressbar"
                :class="isComplete ? 'bg-success' : 'bg-primary'"
                :style="{ width: `${currentProgress}%`, transition: 'width 0.5s ease' }"
                :aria-valuenow="currentProgress"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <div class="shrink-0 text-[13px] font-bold text-slate-500 sm:text-[14px]">
              {{ currentProgress }}%
              <span class="text-[12px] font-semibold text-slate-400">({{ elapsedLabel }})</span>
            </div>
          </div>

          <div class="mt-3 text-center text-[13px] font-bold sm:text-[14px]" :class="isComplete ? 'text-emerald-500' : 'text-blue-600'">
            예상 소요 시간: 약 18초
          </div>
        </div>

        <!-- Task cards -->
        <div class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div
            v-for="(task, index) in taskCardsState"
            :key="task.title"
            class="flex flex-col rounded-[12px] border bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
            :class="taskBorder(index)"
          >
            <div class="flex items-start gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                :class="toneClassMap[task.tone].iconWrap"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path :d="iconPath(task.icon)" />
                </svg>
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="break-keep text-[9px] font-bold tracking-[-0.01em] leading-[1.35] text-slate-900 sm:text-[10px]">
                  {{ task.title }}
                </h3>
                <p class="mt-0.5 break-keep text-[10px] font-medium leading-5 text-slate-400">
                  {{ task.description }}
                </p>
              </div>
            </div>

            <!-- Status pinned to bottom -->
            <div class="mt-auto pt-3 flex items-center gap-1.5">
              <!-- 완료: filled green circle + white checkmark -->
              <template v-if="task.status === '완료'">
                <span class="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <svg class="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                </span>
                <span class="text-[12px] font-bold text-emerald-600">완료</span>
              </template>

              <!-- 진행중: hollow dotted spinning ring -->
              <template v-else-if="task.status === '진행중'">
                <svg class="h-[18px] w-[18px] shrink-0 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="2.5 5" stroke-linecap="round"/>
                </svg>
                <span class="text-[12px] font-bold text-blue-600">진행 중</span>
              </template>

              <!-- 대기: hollow gray circle -->
              <template v-else>
                <span class="inline-block h-[18px] w-[18px] shrink-0 rounded-full border-2 border-slate-300"></span>
                <span class="text-[12px] font-bold text-slate-400">대기</span>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer note -->
        <div class="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-medium text-slate-400 sm:text-[12px]">
          <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
          민감한 데이터는 안전하게 처리되며, AI 분석 결과는 저장되지 않습니다.
        </div>

        <!-- Cancel button -->
        <div v-if="!isComplete" class="mt-6 flex justify-center">
          <AppButton variant="primary" @click="cancelAnalysis">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
            </svg>
            분석 취소
          </AppButton>
        </div>

      </div>
    </div>
  </AppCard>
</template>

<style scoped src="../../styles/style.css"></style>