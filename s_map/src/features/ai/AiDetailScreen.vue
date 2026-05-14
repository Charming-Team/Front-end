<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const PLANS = {
  1: { icon: 'gear', title: '공정 라인 추가 방안', desc: '가용 가능한 추가 생산라인을 투입하여 지연 주문의 생산량을 분산하고 납기 지연 위험을 줄이는 방안입니다.', recommended: true },
  2: { icon: 'clock', title: '공정 시간 증가 방안', desc: '공급 부족 공정을 중심으로 가동 시간을 늘려 생산량을 확보하는 방안입니다.', recommended: false },
  3: { icon: 'box', title: '자재 사용 증가 방안', desc: '추가 자재 확보 및 재고 최적화로 생산 차질을 예방하는 방안입니다.', recommended: false },
  4: { icon: 'shield', title: '현재 상태 유지', desc: '현재 계획을 유지하며 변동 리스크를 최소화합니다.', recommended: false },
}

const planId = computed(() => Number(route.query.id) || 1)
const plan = computed(() => PLANS[planId.value] ?? PLANS[1])

function iconPath(icon) {
  switch (icon) {
    case 'gear':   return 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'
    case 'clock':  return 'M12 7v5l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z'
    case 'box':    return 'm12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4'
    case 'shield': return 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
    default:       return ''
  }
}

const SIM_ROWS = [
  { label: '예상 지연',      before: '2.0일', after: '0일',   change: '-100%',  positive: true  },
  { label: '공급 부족 물량', before: '800kg', after: '0kg',   change: '-100%',  positive: true  },
  { label: '납기 충족률',    before: '72%',   after: '100%',  change: '+28p',   positive: true  },
  { label: '라인 가동률',    before: '78%',   after: '85%',   change: '+7%p',   positive: true  },
  { label: '추가 운영비',    before: '-',     after: '+5.6%', change: '+5.6%',  positive: false },
]

const CMP_ROWS = [
  { label: '예상 지연일',      current: '2일',   applied: '0일',       change: '▼ 2일',    tone: 'green' },
  { label: '납기 충족률',      current: '72%',   applied: '100%',      change: '▲ 28%p',   tone: 'green' },
  { label: '공급 부족 물량',   current: '800kg', applied: '0kg',       change: '▼ 800kg',  tone: 'green' },
  { label: '지연 위험 주문수', current: '200건', applied: '0건',       change: '▼ 200건',  tone: 'green' },
  { label: '라인 가동률',      current: '81%',   applied: '98%',       change: '▲ 17%p',   tone: 'green' },
  { label: '추가 운영비',      current: '없음',  applied: '180만원',   change: '▲ 5.6%p',  tone: 'amber' },
  { label: '추천도',           current: '-',     applied: '매우 높음', change: '-',         tone: 'none'  },
]

const SCHEDULE_ROWS = [
  { id: 'ORD-198', lineChange: 'LINE A → C', before: '2026/05/22 ~ 05/30', after: '2026/05/30 ~ 06/06' },
  { id: 'ORD-199', lineChange: '-',           before: '2026/05/17 ~ 06/03', after: '2026/05/21 ~ 05/29' },
  { id: 'ORD-200', lineChange: 'LINE B → A', before: '2026/05/09 ~ 05/22', after: '2026/05/13 ~ 05/18' },
  { id: 'ORD-201', lineChange: '-',           before: '2026/05/17 ~ 06/03', after: '-' },
]

const changeBadgeClass = {
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  none:  '',
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Back link -->
    <div>
      <AppButton variant="subtle" size="sm" @click="router.push('/ai/result')">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        대응안 목록으로 돌아가기
      </AppButton>
    </div>

    <!-- Plan header card -->
    <AppCard>
      <div class="px-5 py-5 sm:px-6">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg class="h-6 w-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="iconPath(plan.icon)" />
              </svg>
            </div>
            <div>
              <h2 class="text-[18px] font-extrabold tracking-[-0.02em] text-slate-900">{{ plan.title }}</h2>
              <p class="mt-1 text-[13px] font-medium text-slate-500">{{ plan.desc }}</p>
            </div>
          </div>
          <span v-if="plan.recommended" class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-bold text-emerald-700">
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l5.91-1.01z"/>
            </svg>
            권장 대응안
          </span>
        </div>

        <!-- 4 Metric chips -->
        <div class="mt-5 grid grid-cols-4 gap-3">
          <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <svg class="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-semibold text-slate-500">예상 지연</div>
              <div class="text-[17px] font-extrabold text-slate-900">2.0일 <span class="text-emerald-600">→ 0일</span></div>
              <div class="text-[11px] font-bold text-emerald-600">-2.0일 개선</div>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <svg class="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m12 3 7 4v10l-7 4-7-4V7l7-4zm0 0v18m7-14-7 4-7-4"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-semibold text-slate-500">공급 부족 물량</div>
              <div class="text-[17px] font-extrabold text-slate-900">800kg <span class="text-emerald-600">→ 0kg</span></div>
              <div class="text-[11px] font-bold text-emerald-600">800kg 개선</div>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <svg class="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-semibold text-slate-500">납기 충족률</div>
              <div class="text-[17px] font-extrabold text-slate-900">72% <span class="text-emerald-600">→ 100%</span></div>
              <div class="text-[11px] font-bold text-emerald-600">+28%p 개선</div>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-[10px] border border-slate-100 bg-slate-50 px-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
              <svg class="h-5 w-5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 15h.01"/>
              </svg>
            </div>
            <div>
              <div class="text-[11px] font-semibold text-slate-500">추가 운영비</div>
              <div class="text-[17px] font-extrabold text-amber-600">+5.6%</div>
              <div class="text-[11px] font-bold text-slate-400">비용 증가</div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Section 1: 적용 조건 + 시뮬레이션 결과 비교 -->
    <div class="grid grid-cols-2 gap-4">
      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">적용 조건</h3>
          <ul class="flex flex-col gap-3">
            <li
              v-for="(row, i) in [
                { label: '추가 투입 가능 라인', value: 'Line C' },
                { label: '대상 제품', value: '제품 A, B' },
                { label: '적용 기간', value: '2025.05.20 ~ 2025.06.20' },
                { label: '기존 스케줄 중복', value: '없음' },
                { label: '필요 자원', value: '인력 2명, 설비 1대' },
              ]"
              :key="i"
              class="flex items-center gap-2"
            >
              <svg class="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
              </svg>
              <span class="text-[13px] font-semibold text-slate-700">{{ row.label }}</span>
              <span class="ml-auto text-[13px] font-semibold text-slate-500">{{ row.value }}</span>
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
                <th class="pb-2 text-center font-semibold text-slate-500">변화율</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in SIM_ROWS" :key="row.label" class="border-b border-slate-50">
                <td class="py-2.5 font-medium text-slate-700">{{ row.label }}</td>
                <td class="py-2.5 text-center font-medium text-slate-600">{{ row.before }}</td>
                <td class="py-2.5 text-center font-semibold text-slate-900">{{ row.after }}</td>
                <td class="py-2.5 text-center font-bold" :class="row.positive ? 'text-emerald-600' : 'text-amber-600'">{{ row.change }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

    <!-- Section 2: 현재 상태 유지 시 + 대응안과 현재 상태 비교표 -->
    <div class="grid grid-cols-2 gap-4">
      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-1 text-[15px] font-extrabold text-slate-900">현재 상태 유지 시</h3>
          <p class="mb-4 text-[12px] font-medium text-slate-500">현재 생산계획과 자재 상황을 그대로 유지하는 기준 시뮬레이션 결과입니다.</p>
          <p class="mb-2 text-[13px] font-bold text-slate-700">예상 결과</p>
          <div class="mb-4 flex flex-wrap gap-2">
            <span class="rounded-[6px] bg-red-100 px-3 py-1.5 text-[12px] font-bold text-red-700">예상 지연 <strong>2.0일</strong></span>
            <span class="rounded-[6px] bg-amber-100 px-3 py-1.5 text-[12px] font-bold text-amber-700">납기 미충족 <strong>28%</strong></span>
            <span class="rounded-[6px] bg-red-100 px-3 py-1.5 text-[12px] font-bold text-red-700">공급 부족 물량 <strong>800kg</strong></span>
            <span class="rounded-[6px] bg-emerald-100 px-3 py-1.5 text-[12px] font-bold text-emerald-700">추가 운영비 <strong>없음</strong></span>
          </div>
          <p class="mb-1 text-[13px] font-bold text-slate-700">리스크 분석</p>
          <p class="text-[12px] font-medium leading-5 text-slate-500">추가 조치를 하지 않을 경우 주요 주문의 납기 지연이 지속되며, 후속 주문에도 연쇄적인 영향이 발생할 가능성이 있습니다.</p>
        </div>
      </AppCard>

      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">대응안과 현재 상태 비교표</h3>
          <table class="w-full text-[12px]">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="pb-2 text-left font-semibold text-slate-500">비교 항목</th>
                <th class="pb-2 text-center font-semibold text-slate-500">현재 상태 유지</th>
                <th class="pb-2 text-center font-semibold text-slate-500">공정 라인 추가 시</th>
                <th class="pb-2 text-center font-semibold text-slate-500">예상 변화</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in CMP_ROWS" :key="row.label" class="border-b border-slate-50">
                <td class="py-2 font-medium text-slate-700">{{ row.label }}</td>
                <td class="py-2 text-center font-medium text-slate-600">{{ row.current }}</td>
                <td class="py-2 text-center font-semibold text-slate-900">{{ row.applied }}</td>
                <td class="py-2 text-center">
                  <span
                    v-if="row.tone !== 'none'"
                    class="inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-bold"
                    :class="changeBadgeClass[row.tone]"
                  >{{ row.change }}</span>
                  <span v-else class="text-slate-400">{{ row.change }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

    <!-- Section 3: 리스크 해석 + 선택 대응안 변경 일정 -->
    <div class="grid grid-cols-2 gap-4">
      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-3 text-[15px] font-extrabold text-slate-900">리스크 해석</h3>
          <p class="mb-4 text-[13px] font-medium leading-6 text-slate-600">
            추가 조치를 하지 않을 경우 주요 주문의 납기 지연이 지속되며,<br>
            후속 주문에도 연쇄적인 영향이 발생할 가능성이 있습니다.
          </p>
          <div class="rounded-[10px] border border-blue-100 bg-blue-50 px-4 py-3">
            <div class="mb-1.5 flex items-center gap-2">
              <svg class="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
              </svg>
              <span class="text-[13px] font-bold text-blue-800">AI 제안</span>
            </div>
            <p class="text-[12px] font-medium leading-5 text-blue-700">
              해당 대응안을 적용하면 납기 지연과 공급 부족 문제가 모두 해소되며,<br>
              전반적인 생산 안정성이 크게 향상될 것으로 예상됩니다.
            </p>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="px-5 py-5">
          <h3 class="mb-4 text-[15px] font-extrabold text-slate-900">선택 대응안 변경 일정</h3>
          <table class="w-full text-[12px]">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="pb-2 text-left font-semibold text-slate-500">주문 ID</th>
                <th class="pb-2 text-left font-semibold text-slate-500">생산 라인 변화</th>
                <th class="pb-2 text-left font-semibold text-slate-500">변경 전 생산 스케줄</th>
                <th class="pb-2 text-left font-semibold text-slate-500">변경 후 생산 스케줄</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in SCHEDULE_ROWS" :key="row.id" class="border-b border-slate-50">
                <td class="py-2.5 font-semibold text-slate-800">{{ row.id }}</td>
                <td class="py-2.5 font-medium text-slate-600">{{ row.lineChange }}</td>
                <td class="py-2.5 font-medium text-slate-500">{{ row.before }}</td>
                <td class="py-2.5 font-medium" :class="row.after === '-' ? 'text-slate-400' : 'text-slate-800'">{{ row.after }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>

    <!-- AI 종합 평가 (최하단) -->
    <AppCard>
      <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-start gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <svg class="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          </div>
          <div>
            <p class="text-[13px] font-bold text-slate-900">AI 종합 평가</p>
            <p class="mt-0.5 text-[12px] font-medium text-slate-500">
              추가 라인 투입 시 납기 지연이 해소되고, 납기 충족률이 28%p 개선됩니다.<br>
              추가 비용 증가폭이 크지 않아 전반적으로 효과적인 대응안으로 평가됩니다.
            </p>
          </div>
        </div>
        <div class="ml-6 flex shrink-0 items-center gap-2">
          <AppButton variant="secondary" size="sm" @click="router.push('/ai/result')">다른 대응안 비교하기</AppButton>
          <AppButton variant="primary" size="sm" @click="router.push('/plan')">이 대응안 적용하기</AppButton>
        </div>
      </div>
    </AppCard>

    <!-- Bottom action -->
    <div class="flex flex-col items-center gap-2">
      <AppButton variant="primary" size="lg" @click="router.push('/plan')">
        변경 적용하기
      </AppButton>
      <p class="flex items-center gap-1.5 text-[12px] font-medium text-slate-400">
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        변경 적용 시 기존 생산 계획과 스케줄이 업데이트됩니다.
      </p>
    </div>

  </div>
</template>
