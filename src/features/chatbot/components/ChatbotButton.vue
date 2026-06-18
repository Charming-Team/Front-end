<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUserRole } from '../../../utils/storage.js'
import logoSymbol from '../../../assets/logo_main.svg'
import { requestChatAnswer } from '../api.js'

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
    '오늘 생산할 제품명과 배정된 생산계획을 조회해줘',
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

const isOpen = ref(false)
const message = ref('')
const loading = ref(false)
const sessionId = ref(Date.now())
const nextMessageId = ref(2)
const messagesRef = ref(null)
const router = useRouter()
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    text: '안녕하세요! S-MAP AI 어시스턴트입니다. 생산계획, 납기 위험, 자재 현황 등을 물어보세요.',
    time: '지금',
    urls: [],
  },
])

const userRole = computed(() => {
  const role = getUserRole()
  return ROLE_QUESTIONS[role] ? role : 'OPERATOR'
})

const suggestedQuestions = computed(() => ROLE_QUESTIONS[userRole.value])

function nowLabel() {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

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

function buildAssistantText(answer) {
  if (answer?.answer) return answer.answer
  if (answer?.securityResult?.reason) return answer.securityResult.reason
  return '챗봇 응답을 받았지만 표시할 답변이 없습니다.'
}

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url)
}

function getInternalRoute(url) {
  if (!url) return ''

  try {
    if (isExternalUrl(url)) {
      const parsedUrl = new URL(url)
      if (typeof window !== 'undefined' && parsedUrl.origin === window.location.origin) {
        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
      }

      return ''
    }

    const parsedUrl = new URL(url, 'http://s-map.local')
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url.startsWith('/') ? url : ''
  }
}

function normalizeAssistantUrls(urls, sources = []) {
  const candidates = [
    ...(Array.isArray(urls) ? urls : []),
    ...(Array.isArray(sources) ? sources : []),
  ]
  const usedUrls = new Set()

  return candidates
    .filter(item => typeof item?.url === 'string' && item.url.trim())
    .map((item, index) => {
      const url = item.url.trim()
      const label = typeof item.label === 'string' && item.label.trim()
        ? item.label.trim()
        : typeof item.title === 'string' && item.title.trim()
          ? item.title.trim()
          : url
      const type = typeof item.type === 'string' && item.type.trim()
        ? item.type.trim()
        : typeof item.sourceType === 'string'
          ? item.sourceType.trim()
          : ''
      const internalRoute = getInternalRoute(url)
      const external = isExternalUrl(url) && !internalRoute

      return {
        id: `${type || 'URL'}-${url}-${index}`,
        label,
        type,
        url,
        route: internalRoute,
        external,
      }
    })
    .filter(link => {
      if (!link.route && !link.external) return false
      const key = link.route || link.url
      if (usedUrls.has(key)) return false
      usedUrls.add(key)
      return true
    })
}

function openAssistantLink(link) {
  if (!link?.route) return
  router.push(link.route)
}

async function submitMessage(text = message.value) {
  const trimmed = text.trim()
  if (!trimmed || loading.value) return

  const userMessageId = nextMessageId.value++
  const assistantMessageId = nextMessageId.value++

  messages.value = [
    ...messages.value,
    {
      id: userMessageId,
      role: 'user',
      text: trimmed,
      time: nowLabel(),
      urls: [],
    },
  ]
  message.value = ''
  loading.value = true
  scrollToLatestMessage()

  try {
    const answer = await requestChatAnswer({
      question: trimmed,
      sessionId: sessionId.value,
      messageId: userMessageId,
    })

    messages.value = [
      ...messages.value,
      {
        id: assistantMessageId,
        role: 'assistant',
        text: buildAssistantText(answer),
        time: nowLabel(),
        urls: normalizeAssistantUrls(answer?.urls, answer?.sources),
      },
    ]
  } catch (err) {
    messages.value = [
      ...messages.value,
      {
        id: assistantMessageId,
        role: 'assistant',
        text: err.message || '챗봇 답변 요청에 실패했습니다.',
        time: nowLabel(),
        urls: [],
      },
    ]
  } finally {
    loading.value = false
    scrollToLatestMessage()
  }
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
        <header class="app-chatbot-panel-header">
          <div class="app-chatbot-panel-title">
            <img :src="logoSymbol" alt="" aria-hidden="true" />
            <strong>S-MAP</strong>
            <span>챗봇</span>
          </div>
          <button type="button" class="app-chatbot-panel-close" aria-label="챗봇 닫기" @click="closeChatbot">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div ref="messagesRef" class="app-chatbot-panel-messages">
          <div
            v-for="item in messages"
            :key="item.id"
            class="app-chatbot-message"
            :class="`app-chatbot-message-${item.role}`"
          >
            <p>{{ item.text }}</p>
            <div v-if="item.urls?.length" class="app-chatbot-message-links" aria-label="상세 이동">
              <template v-for="link in item.urls" :key="link.id">
                <a
                  v-if="link.external"
                  :href="link.url"
                  target="_blank"
                  rel="noreferrer"
                  class="app-chatbot-message-link"
                >
                  <span class="app-chatbot-message-link-label">{{ link.label }}</span>
                  <span v-if="link.type" class="app-chatbot-message-link-type">{{ link.type }}</span>
                </a>
                <button v-else type="button" class="app-chatbot-message-link" @click="openAssistantLink(link)">
                  <span class="app-chatbot-message-link-label">{{ link.label }}</span>
                  <span v-if="link.type" class="app-chatbot-message-link-type">{{ link.type }}</span>
                </button>
              </template>
            </div>
            <small>{{ item.time }}</small>
          </div>
        </div>

        <div class="app-chatbot-panel-suggestions" aria-label="추천 질문">
          <button
            v-for="question in suggestedQuestions"
            :key="question"
            type="button"
            :disabled="loading"
            @click="submitMessage(question)"
          >
            {{ question }}
          </button>
        </div>

        <form class="app-chatbot-panel-composer" @submit.prevent="submitMessage()">
          <input
            v-model="message"
            type="text"
            :placeholder="loading ? '답변을 생성하고 있습니다 ...' : '메시지를 입력하세요 ...'"
            :disabled="loading"
          />
          <button type="submit" aria-label="메시지 보내기" :disabled="loading || !message.trim()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 3 10 14" />
              <path d="m21 3-7 18-4-7-7-4 18-7Z" />
            </svg>
          </button>
        </form>
      </section>
    </Transition>

    <AppButton v-if="!isOpen" class="app-chatbot-button" :aria-label="label" @click="openChatbot">
      <span class="app-chatbot-button-bubble" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </span>
      <span>{{ label }}</span>
    </AppButton>
  </div>
</template>

<style scoped src="../styles/chatbot-button.css"></style>
