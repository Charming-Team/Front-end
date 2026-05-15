<!--
  [Screen] AI 분석 결과 — 대응안 목록 화면
  역할: 분석 완료 후 생성된 4가지 대응안을 2×2 카드로 보여줍니다.
        카드 클릭 시 /ai/detail?id=N으로 이동하며, '현재 상태 유지'(id=4)는 /plan으로 이동합니다.
  API 연동 시: 대응안 목록(제목·설명·단계)을 API 응답으로 교체하고, PLANS 상수를 제거할 예정입니다.
-->
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const PLANS = [
  {
    id: 1,
    color: 'blue',
    icon: 'gear',
    title: '공정 라인 추가 방안',
    desc: '가용 라인을 최적배분하여 생산 능력을 확대합니다.',
    steps: ['가용 라인 확인 및 평가', '생산 가능 제품 매칭', '스케줄 충돌 분석', '라인 추가 배정 및 확정'],
  },
  {
    id: 2,
    color: 'green',
    icon: 'clock',
    title: '공정 시간 증가 방안',
    desc: '공급 부족 공정을 중심으로 가동 시간을 확보합니다.',
    steps: ['공급 부족 물량 확인', '필요 연장 시간 산정', '추가 가동 가능 여부 검토', '연장 가동 스케줄 반영'],
  },
  {
    id: 3,
    color: 'purple',
    icon: 'box',
    title: '자재 사용 증가 방안',
    desc: '추가 자재 확보 및 재고 최적화로 생산 차질을 예방합니다.',
    steps: ['부족 자재 확인', '재요·입고 일정 검토', '긴급 발주/대체 자재 검토', '생산 가능 수량 재계산'],
  },
  {
    id: 4,
    color: 'amber',
    icon: 'shield',
    title: '현재 상태 유지',
    desc: '현재 계획을 유지하며 변동 리스크를 최소화합니다.',
    steps: ['현재 계획 검토', '추가 조치 필요성 판단', '모니터링 대상 등록', '리스크 변화 시 재검토'],
  },
]

const COLOR_MAP = {
  blue:   { badge: '#1565C0', iconBg: '#DBEAFE', iconColor: '#1565C0', stepBg: '#EEF4FF', stepText: '#1565C0' },
  green:  { badge: '#1565C0', iconBg: '#DBEAFE', iconColor: '#1565C0', stepBg: '#EEF4FF', stepText: '#1565C0' },
  purple: { badge: '#1565C0', iconBg: '#DBEAFE', iconColor: '#1565C0', stepBg: '#EEF4FF', stepText: '#1565C0' },
  amber:  { badge: '#F57C00', iconBg: '#FEF3C7', iconColor: '#F57C00', stepBg: '#FFF8EC', stepText: '#F57C00' },
}

function navigate(plan) {
  if (plan.id === 4) {
    router.push('/plan')
  } else {
    router.push('/ai/detail?id=' + plan.id)
  }
}

function iconPath(icon) {
  switch (icon) {
    case 'gear':   return 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    case 'clock':  return 'M12 7v5l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'
    case 'box':    return 'm12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4'
    case 'shield': return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
    default:       return ''
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Success banner -->
    <AppCard>
      <div class="flex items-center gap-3 px-5 py-4">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </span>
        <span class="text-[15px] font-bold text-emerald-800">생산 계획이 모두 완료되었습니다.</span>
      </div>
    </AppCard>

    <!-- 대응안 목록 및 상세 내용 container -->
    <AppCard>
      <div class="px-5 py-4 sm:px-6">

        <!-- Section heading -->
        <div class="mb-1 border-l-4 border-[#1565C0] pl-3">
          <h2 class="text-[15px] font-extrabold tracking-[-0.02em] text-[var(--color-navy)]">대응안 목록 및 상세 내용</h2>
        </div>
        <p class="mb-4 pl-3 text-[12px] font-medium text-[var(--color-text-subtle)]">생산 계획 실행을 위한 4가지 대응안과 세부 실행 단계를 확인하세요.</p>

        <!-- 2×2 plan cards -->
        <div class="grid grid-cols-2 gap-4">
          <AppCard
            v-for="plan in PLANS"
            :key="plan.id"
            class="cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,23,42,0.10)]"
            @click="navigate(plan)"
          >
            <div class="relative flex flex-col items-center px-5 py-4">

              <!-- Number badge -->
              <span
                class="absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white"
                :style="{ backgroundColor: COLOR_MAP[plan.color].badge }"
              >{{ plan.id }}</span>

              <!-- Icon -->
              <div
                class="mb-2 mt-2 flex h-12 w-12 items-center justify-center rounded-full"
                :style="{ backgroundColor: COLOR_MAP[plan.color].iconBg }"
              >
                <svg
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :style="{ color: COLOR_MAP[plan.color].iconColor }"
                >
                  <path :d="iconPath(plan.icon)" />
                </svg>
              </div>

              <!-- Title -->
              <h3
                class="mb-1 text-center text-[14px] font-extrabold"
                :style="{ color: COLOR_MAP[plan.color].badge }"
              >{{ plan.title }}</h3>

              <!-- Description -->
              <p class="mb-3 text-center text-[11px] font-medium leading-[1.5] text-[var(--color-text-subtle)]">{{ plan.desc }}</p>

              <!-- Step list -->
              <div class="w-full">
                <div v-for="(step, i) in plan.steps" :key="i" class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span
                      class="inline-flex w-[46px] shrink-0 items-center justify-center rounded-[4px] py-0.5 text-[10px] font-bold"
                      :style="{ backgroundColor: COLOR_MAP[plan.color].stepBg, color: COLOR_MAP[plan.color].stepText }"
                    >STEP {{ i + 1 }}</span>
                    <span class="text-[11px] font-medium text-[var(--color-text-main)]">{{ step }}</span>
                  </div>
                  <div
                    v-if="i < plan.steps.length - 1"
                    class="ml-[22px] h-2.5 w-px"
                    :style="{ backgroundColor: COLOR_MAP[plan.color].stepText, opacity: 0.25 }"
                  ></div>
                </div>
              </div>

            </div>
          </AppCard>
        </div>

      </div>
    </AppCard>

  </div>
</template>
