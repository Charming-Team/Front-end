<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { getUserRole } from '../../../utils/storage.js'
import logoSymbol from '../../../assets/logo_main.svg'

defineProps({
  label: { type: String, default: '챗봇' },
})

const ROLE_QUESTIONS = {
  EXECUTIVE: [
    '현재 납기 위험이 높은 주문을 알려줘',
    '납기 지연 시 예상 패널티와 계약 금액 영향을 알려줘',
    '이번 주 전체 생산 리스크를 요약해줘',
    '라인 가동률과 병목 현황을 요약해줘',
    '긴급 주문이 전체 생산계획에 미치는 영향을 알려줘',
    '최근 생산 리스크 보고서를 요약해줘',
  ],
  MANUFACTURING_MANAGER: [
    '자재 부족으로 영향받는 생산계획을 알려줘',
    '오늘 변경이 필요한 생산계획을 알려줘',
    '현재 병목이 발생한 라인과 원인을 알려줘',
    '긴급 주문이 전체 생산계획에 미치는 영향을 알려줘',
    '오늘 먼저 처리해야 할 작업 우선순위를 알려줘',
    '최근 제조 리스크 보고서를 요약해줘',
  ],
  OPERATOR: [
    '현재 자재 재고 현황을 조회해줘',
    '오늘 배정된 생산계획을 조회해줘',
    '내 담당 라인의 현재 상태를 조회해줘',
    '내 담당 설비의 현재 상태를 조회해줘',
    '오늘 처리 수량과 불량 수량을 조회해줘',
    '오늘 먼저 처리해야 할 작업 우선순위를 알려줘',
  ],
}

const QUESTION_ANSWERS = {
  '현재 납기 위험이 높은 주문을 알려줘':
    '현재 납기 위험이 가장 높은 주문은 ORD-198입니다.\n위험도: 매우 위험\n예상 지연: 약 19.2일\n주요 원인: ABS-Black 자재 부족, 수율 저하, LINE-A 대기 작업 증가입니다.\n추가로 ORD-205도 자재 부족으로 위험 상태라 함께 확인이 필요합니다.',

  '납기 지연 시 예상 패널티와 계약 금액 영향을 알려줘':
    '현재 가장 큰 영향이 예상되는 주문은 ORD-198입니다.\n예상 지연일은 약 19.2일이며, 납기 위약금과 긴급 물류비가 함께 발생할 수 있습니다.\n계약 금액 영향은 지연 기간이 길수록 커지므로 ORD-198을 우선 생산 대상으로 올리고, 부족 자재 선확보와 대체 라인 투입을 검토하는 것이 좋습니다.',

  '이번 주 전체 생산 리스크를 요약해줘':
    '이번 주 주요 생산 리스크는 3가지입니다.\n1. 지연 위험 주문 18건\n2. 긴급 주문 3건으로 인한 라인 재배치 부담\n3. 자재 부족 품목 2건\n특히 LINE-D와 LINE-F의 가동률이 낮고, 일부 주문의 진행률이 떨어져 납기 위험이 커질 수 있습니다.',

  '라인 가동률과 병목 현황을 요약해줘':
    '라인별 가동률은 LINE-A 80%, LINE-B 55%, LINE-C 60%, LINE-D 36%, LINE-E 72%, LINE-F 42%입니다.\n현재 병목 후보는 LINE-D와 LINE-F입니다.\nLINE-D는 전환 시간 증가와 지연 구간이 겹쳐 있고, LINE-F는 비가동과 지연 구간이 함께 확인됩니다.',

  '긴급 주문이 전체 생산계획에 미치는 영향을 알려줘':
    '긴급 주문 3건은 기존 생산계획의 우선순위를 흔들 수 있습니다.\n주요 영향은 라인 재배치, 셋업 시간 증가, 후순위 주문의 착수 지연입니다.\n특히 LINE-D처럼 가동률이 낮은 라인은 긴급 주문 투입 시 병목이 더 커질 수 있어 유사 제품 묶음 생산과 대체 라인 검토가 필요합니다.',

  '최근 생산 리스크 보고서를 요약해줘':
    '최근 생산 리스크 보고서의 핵심은 생산 효율 저하와 일부 라인의 병목입니다.\n생산계획 대비 실적은 96.0%, 납기 준수율은 98.1% 수준입니다.\n다만 LINE-B와 일부 설비의 운영 효율 저하, 불량률 소폭 증가가 확인되어 예방 정비와 라인 부하 분산이 필요합니다.',

  '자재 부족으로 영향받는 생산계획을 알려줘':
    '자재 부족 영향이 큰 생산계획은 ORD-198 관련 PLAN-104와 ORD-205 관련 PLAN-205입니다.\nORD-198은 ABS-Black 원료 부족으로 예상 지연이 큽니다.\nORD-205는 PA-Natural 원료 부족과 LINE-D 대기 작업이 함께 영향을 주고 있습니다.',

  '오늘 변경이 필요한 생산계획을 알려줘':
    '오늘 우선 변경 검토가 필요한 계획은 LINE-D와 LINE-F 관련 작업입니다.\nLINE-D는 전환 시간 증가와 지연 구간이 있어 작업 순서 조정이 필요합니다.\nORD-198, ORD-205는 자재 확보 여부에 따라 시작 시점 또는 대체 라인 배정 검토가 필요합니다.',

  '현재 병목이 발생한 라인과 원인을 알려줘':
    '현재 병목 가능성이 가장 높은 라인은 LINE-D입니다.\n가동률이 36%로 낮고, 전환 시간 증가와 지연 작업이 함께 확인됩니다.\nLINE-F도 가동률 42%로 낮아 비가동 원인과 작업 대기 상태를 확인해야 합니다.',

  '오늘 먼저 처리해야 할 작업 우선순위를 알려줘':
    '오늘 우선순위는 다음 순서가 좋습니다.\n1. ORD-198 부족 자재 확보 및 대체 라인 검토\n2. ORD-205 자재 입고 일정 확인\n3. LINE-D 전환 작업 단축 및 작업 순서 조정\n4. LINE-F 비가동 원인 확인\n5. 진행률 낮은 주문 PO-240520-002, PO-240520-005 점검',

  '최근 제조 리스크 보고서를 요약해줘':
    '최근 제조 리스크는 자재 부족과 라인 병목에 집중되어 있습니다.\n주요 위험은 ABS-Black, PA-Natural 계열 자재 부족과 LINE-D 전환 시간 증가입니다.\n제조 관점에서는 부족 자재 확보, 라인 부하 분산, 셋업 시간 단축이 우선 과제입니다.',

  '현재 자재 재고 현황을 조회해줘':
    '현재 자재 현황은 주의가 필요합니다.\n부족 품목은 2건이며, ABS-Black과 PA-Natural 계열 자재가 주요 위험 항목입니다.\nPP-Heat는 입고 일정 확인이 필요하고, PE-Clear는 재고 변동 감시 대상입니다.',

  '오늘 배정된 생산계획을 조회해줘':
    '오늘 배정된 주요 생산계획은 LINE-D와 LINE-F 상태 확인이 우선입니다.\nLINE-D는 ORD-205 관련 작업과 전환 작업 영향이 있어 작업 순서 확인이 필요합니다.\n진행률이 낮은 주문은 PO-240520-002, PO-240520-005입니다.',

  '내 담당 라인의 현재 상태를 조회해줘':
    '내 담당 라인 기준으로 현재 주의가 필요한 라인은 LINE-D입니다.\n가동률은 36%로 낮고, 전환 시간 증가와 지연 작업이 확인됩니다.\n작업 전 전환 완료 여부와 선행 작업 대기 상태를 먼저 확인하세요.',

  '내 담당 설비의 현재 상태를 조회해줘':
    '담당 설비는 예방 점검이 필요한 상태로 보는 것이 좋습니다.\n최근 보고서 기준 일부 설비 다운타임과 운영 효율 저하가 확인되었습니다.\n작업 시작 전 설비 알람, 셋업 상태, 비가동 이력을 확인해 주세요.',

  '오늘 처리 수량과 불량 수량을 조회해줘':
    '오늘 처리 현황은 생산계획 대비 실적과 불량률을 함께 봐야 합니다.\n최근 기준 생산계획 대비 실적은 96.0%, 불량 수량은 1,152EA, 불량률은 1.00%입니다.\n오늘 작업에서는 불량률 상승 라인을 우선 확인하는 것이 좋습니다.',
}

const isOpen = ref(false)
const message = ref('')
const messagesRef = ref(null)
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! S-MAP AI 어시스턴트입니다. 생산계획, 납기 위험, 자재 현황 등을 물어보세요.',
    time: '지금',
  },
])

const userRole = computed(() => {
  const role = getUserRole()
  return ROLE_QUESTIONS[role] ? role : 'OPERATOR'
})

const suggestedQuestions = computed(() => ROLE_QUESTIONS[userRole.value])

function scrollToLatestMessage() {
  nextTick(() => {
    const el = messagesRef.value
    if (!el) return

    el.scrollTop = el.scrollHeight
  })
}

function openChatbot() {
  isOpen.value = true
  scrollToLatestMessage()
}

function closeChatbot() {
  isOpen.value = false
}

function submitMessage(text = message.value) {
  const trimmed = text.trim()
  if (!trimmed) return
  const response =
    QUESTION_ANSWERS[trimmed] ??
    '질문을 확인했습니다.\n현재 데모 환경에서는 추천질문 중심으로 답변을 제공합니다. 실제 AI 응답 API가 연결되면 입력하신 질문에 대한 분석 결과가 표시됩니다.'

  messages.value = [
    ...messages.value,
    {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      time: '지금',
    },
    {
      id: Date.now() + 1,
      role: 'assistant',
      text: response,
      time: '지금',
    },
  ]
  message.value = ''
  scrollToLatestMessage()
}

watch(
  () => messages.value.length,
  () => scrollToLatestMessage()
)
</script>

<template>
  <div class="app-chatbot">
    <Transition name="app-chatbot-panel">
      <section v-if="isOpen" class="app-chatbot-panel" aria-label="S-MAP 챗봇">
        <header class="app-chatbot-panel__header">
          <div class="app-chatbot-panel__title">
            <img :src="logoSymbol" alt="" aria-hidden="true" />
            <strong>S-MAP</strong>
            <span>챗봇</span>
          </div>
          <button type="button" class="app-chatbot-panel__close" aria-label="챗봇 닫기" @click="closeChatbot">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div ref="messagesRef" class="app-chatbot-panel__messages">
          <div
            v-for="item in messages"
            :key="item.id"
            class="app-chatbot-message"
            :class="`app-chatbot-message--${item.role}`"
          >
            <p>{{ item.text }}</p>
            <small>{{ item.time }}</small>
          </div>
        </div>

        <div class="app-chatbot-panel__suggestions" aria-label="추천 질문">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            type="button"
            @click="submitMessage(question)"
          >
            {{ question }}
          </button>
        </div>

        <form class="app-chatbot-panel__composer" @submit.prevent="submitMessage()">
          <input v-model="message" type="text" placeholder="메시지를 입력하세요 ..." />
          <button type="submit" aria-label="메시지 보내기" :disabled="!message.trim()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 3 10 14" />
              <path d="m21 3-7 18-4-7-7-4 18-7Z" />
            </svg>
          </button>
        </form>
      </section>
    </Transition>

    <AppButton v-if="!isOpen" class="app-chatbot-button" :aria-label="label" @click="openChatbot">
      <span class="app-chatbot-button__bubble" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </span>
      <span>{{ label }}</span>
    </AppButton>
  </div>
</template>

<style scoped src="../styles/chatbot-button.css"></style>
