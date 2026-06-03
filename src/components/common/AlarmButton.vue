<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  count: { type: [Number, String], default: '' },
  label: { type: String, default: '알림' },
})

const READ_STORAGE_KEY = 's_map_read_notifications'
const TOAST_STORAGE_KEY = 's_map_toast_notifications'
const DELETED_STORAGE_KEY = 's_map_deleted_notifications'
const TOAST_NOTIFICATION_EVENT = 's-map:toast-notification'

const router = useRouter()
const isOpen = ref(false)
const alarmRef = ref(null)
const readNotificationIds = ref(loadReadNotificationIds())
const toastNotifications = ref(loadToastNotifications())
const deletedNotificationIds = ref(loadDeletedNotificationIds())

const defaultNotifications = [
  {
    id: 'ORD-198',
    title: 'ORD-198',
    message: '납기 지연 위험',
    level: '매우 위험',
    tone: 'critical',
    to: '/risk/ORD-198',
  },
  {
    id: 'ORD-205',
    title: 'ORD-205',
    message: '자재 부족 위험',
    level: '위험',
    tone: 'danger',
    to: '/risk/ORD-205',
  },
  {
    id: 'LINE-D-changeover',
    title: 'Line D',
    message: '전환 시간 증가',
    level: '주의',
    tone: 'warning',
    to: '/plan',
  },
  {
    id: 'LINE-D-report',
    title: 'Line D',
    message: '보고서 생성 완료',
    level: '완료',
    tone: 'success',
    to: '/reports/1',
  },
  {
    id: 'MAT-ABS-Black',
    title: 'ABS-Black',
    message: '안전재고 이하',
    level: '위험',
    tone: 'danger',
    to: '/materials',
  },
  {
    id: 'LINE-B-delay',
    title: 'Line B',
    message: '작업 지연 발생',
    level: '주의',
    tone: 'warning',
    to: '/plan',
  },
  {
    id: 'RISK-summary',
    title: '리스크 분석',
    message: '고위험 주문 5건 감지',
    level: '위험',
    tone: 'danger',
    to: '/risk',
  },
  {
    id: 'PLAN-104',
    title: 'PLAN-104',
    message: '계획 재조정 필요',
    level: '주의',
    tone: 'warning',
    to: '/plan',
  },
  {
    id: 'MAT-PP-Heat',
    title: 'PP-Heat',
    message: '입고 일정 확인 필요',
    level: '주의',
    tone: 'warning',
    to: '/materials',
  },
  {
    id: 'REPORT-monthly',
    title: '보고서',
    message: '월간 보고서 생성 완료',
    level: '완료',
    tone: 'success',
    to: '/reports/1',
  },
  {
    id: 'LINE-A-utilization',
    title: 'Line A',
    message: '가동률 80% 도달',
    level: '완료',
    tone: 'success',
    to: '/plan',
  },
  {
    id: 'ORDER-progress',
    title: '주문 현황',
    message: '달성률 하락 주문 확인',
    level: '주의',
    tone: 'warning',
    to: '/',
  },
  {
    id: 'AI-analysis',
    title: 'AI 분석',
    message: '대응안 생성 가능',
    level: '완료',
    tone: 'success',
    to: '/ai/analysis',
  },
  {
    id: 'MAT-PE-Clear',
    title: 'PE-Clear',
    message: '재고 변동 감지',
    level: '주의',
    tone: 'warning',
    to: '/materials',
  },
  {
    id: 'LINE-F-low',
    title: 'Line F',
    message: '가동률 저조',
    level: '주의',
    tone: 'warning',
    to: '/plan',
  },
]

const notifications = computed(() => [
  ...toastNotifications.value,
  ...defaultNotifications,
].filter(notification => !isDeleted(notification.id)))

const unreadCount = computed(() =>
  notifications.value.filter(notification => !isRead(notification.id)).length
)

function loadReadNotificationIds() {
  if (typeof window === 'undefined') return []

  try {
    const saved = JSON.parse(window.localStorage.getItem(READ_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function saveReadNotificationIds(ids) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // 읽음 상태 저장에 실패해도 알림 이동은 계속 동작해야 합니다.
  }
}

function loadToastNotifications() {
  if (typeof window === 'undefined') return []

  try {
    const saved = JSON.parse(window.localStorage.getItem(TOAST_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter(isValidNotification) : []
  } catch {
    return []
  }
}

function loadDeletedNotificationIds() {
  if (typeof window === 'undefined') return []

  try {
    const saved = JSON.parse(window.localStorage.getItem(DELETED_STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function saveDeletedNotificationIds(ids) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // 삭제 상태 저장 실패는 화면 동작을 막지 않습니다.
  }
}

function saveToastNotifications(items) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(TOAST_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // 알림 내역 저장 실패는 화면 동작을 막지 않습니다.
  }
}

function isValidNotification(item) {
  return item && typeof item.id === 'string' && typeof item.title === 'string'
}

function isRead(id) {
  return readNotificationIds.value.includes(id)
}

function isDeleted(id) {
  return deletedNotificationIds.value.includes(id)
}

function markAsRead(id) {
  if (isRead(id)) return

  readNotificationIds.value = [...readNotificationIds.value, id]
  saveReadNotificationIds(readNotificationIds.value)
}

function toggleAlarm() {
  isOpen.value = !isOpen.value
}

function closeAlarm() {
  isOpen.value = false
}

function goToNotification(notification) {
  markAsRead(notification.id)
  closeAlarm()
  router.push(notification.to)
}

function deleteAllNotifications() {
  if (notifications.value.length === 0) return

  const nextDeletedIds = new Set(deletedNotificationIds.value)
  notifications.value.forEach(notification => nextDeletedIds.add(notification.id))
  deletedNotificationIds.value = [...nextDeletedIds]
  toastNotifications.value = []
  saveDeletedNotificationIds(deletedNotificationIds.value)
  saveToastNotifications([])
}

function getToastTone(type) {
  if (type === 'success') return 'success'
  if (['warning', 'caution'].includes(type)) return 'warning'
  if (['error', 'danger', 'fail'].includes(type)) return 'danger'
  return 'success'
}

function getToastLevel(type) {
  if (type === 'success') return '완료'
  if (['warning', 'caution'].includes(type)) return '주의'
  if (['error', 'danger', 'fail'].includes(type)) return '위험'
  return '알림'
}

function addToastNotification(e) {
  const detail = e.detail ?? {}
  const type = String(detail.type ?? 'success')
  const title = String(detail.title ?? '새 알림')
  const message = String(detail.message || '새로운 알림이 도착했습니다.')
  const to = String(detail.to || router.currentRoute.value.fullPath || '/')
  const notification = {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    message,
    level: getToastLevel(type),
    tone: getToastTone(type),
    to,
  }

  toastNotifications.value = [notification, ...toastNotifications.value].slice(0, 50)
  saveToastNotifications(toastNotifications.value)
}

function onDocumentClick(e) {
  if (alarmRef.value && !alarmRef.value.contains(e.target)) {
    closeAlarm()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener(TOAST_NOTIFICATION_EVENT, addToastNotification)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener(TOAST_NOTIFICATION_EVENT, addToastNotification)
})
</script>

<template>
  <div ref="alarmRef" class="app-alarm">
    <AppButton
      class="app-alarm-button"
      variant="surface"
      size="icon"
      :icon-only="true"
      :aria-label="label"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click.stop="toggleAlarm"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
      <span v-if="unreadCount > 0" class="app-alarm-button__badge">{{ unreadCount }}</span>
    </AppButton>

    <div v-if="isOpen" class="app-alarm-panel" role="dialog" aria-label="알림 목록">
      <header class="app-alarm-panel__header">
        <div>
          <h2>알림</h2>
          <p>미확인 {{ unreadCount }}개</p>
        </div>
        <div class="app-alarm-panel__actions">
          <button
            type="button"
            class="app-alarm-panel__delete"
            :disabled="notifications.length === 0"
            @click="deleteAllNotifications"
          >
            전체 삭제
          </button>
          <span class="app-alarm-panel__total">전체 {{ notifications.length }}</span>
          <button type="button" class="app-alarm-panel__close" aria-label="알림 닫기" @click="closeAlarm">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div class="app-alarm-panel__list">
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="app-alarm-item"
          :class="{ 'is-read': isRead(notification.id) }"
          @click="goToNotification(notification)"
        >
          <span v-if="!isRead(notification.id)" class="app-alarm-item__dot" aria-hidden="true"></span>
          <span class="app-alarm-item__icon" :class="`app-alarm-item__icon--${notification.tone}`">
            <svg v-if="notification.tone !== 'success'" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 2.8 19h18.4L12 3Z" />
              <path d="M12 8v6M12 17.5h.01" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span class="app-alarm-item__content">
            <strong>{{ notification.title }}</strong>
            <small>{{ notification.message }}</small>
          </span>
          <span class="app-alarm-item__status">
            <span class="app-alarm-item__badge" :class="`app-alarm-item__badge--${notification.tone}`">
              {{ notification.level }}
            </span>
          </span>
        </button>

        <div v-if="notifications.length === 0" class="app-alarm-empty">
          <strong>알림이 없습니다</strong>
          <small>새 토스트가 뜨면 이곳에 추가됩니다.</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./styles/alarm-button.css"></style>
