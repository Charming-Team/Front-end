<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createNotificationEventSource,
  deleteAllNotifications as deleteAllNotificationsApi,
  fetchNotifications,
  fetchNotificationUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../features/notifications/api.js'

defineProps({
  count: { type: [Number, String], default: '' },
  label: { type: String, default: '알림' },
})

const TOAST_NOTIFICATION_EVENT = 's-map:toast-notification'
const DEFAULT_SIZE = 20

const router = useRouter()
const isOpen = ref(false)
const alarmRef = ref(null)
const notifications = ref([])
const unreadCountFromServer = ref(0)
const nextCursor = ref(null)
const hasNext = ref(false)
const isLoading = ref(false)
const eventSource = ref(null)
const reconnectTimer = ref(null)

const unreadCount = computed(() => unreadCountFromServer.value)

function normalizeNotification(item) {
  const id = item.notificationId ?? item.id
  return {
    id,
    notificationId: id,
    title: item.title || '알림',
    message: item.content || item.message || '새로운 알림이 도착했습니다.',
    level: getLevelLabel(item.severity, item.notificationType),
    tone: getTone(item.severity, item.notificationType),
    to: resolveNotificationUrl(item),
    isRead: item.isRead === true,
    createdAt: item.createdAt,
    notificationType: item.notificationType,
    severity: item.severity,
  }
}

function mergeNotifications(items) {
  const byId = new Map(notifications.value.map((item) => [String(item.id), item]))

  items.forEach((item) => {
    const normalized = normalizeNotification(item)
    byId.set(String(normalized.id), normalized)
  })

  notifications.value = [...byId.values()].sort((left, right) => {
    const leftTime = Date.parse(left.createdAt || '') || 0
    const rightTime = Date.parse(right.createdAt || '') || 0
    return rightTime - leftTime
  })
}

async function loadNotifications({ append = false } = {}) {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const response = await fetchNotifications({
      cursor: append ? nextCursor.value : null,
      size: DEFAULT_SIZE,
    })

    const items = Array.isArray(response?.items) ? response.items : []
    if (append) {
      mergeNotifications(items)
    } else {
      notifications.value = items.map(normalizeNotification)
    }

    unreadCountFromServer.value = Number(response?.unreadCount ?? 0)
    nextCursor.value = response?.nextCursor ?? null
    hasNext.value = response?.hasNext === true
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

function toggleAlarm() {
  isOpen.value = !isOpen.value
  if (isOpen.value) loadNotifications()
}

function closeAlarm() {
  isOpen.value = false
}

async function goToNotification(notification) {
  await markAsRead(notification)
  closeAlarm()
  if (notification.to) router.push(notification.to)
}

async function markAsRead(notification) {
  if (!notification?.notificationId || notification.isRead) return

  notification.isRead = true
  try {
    const response = await markNotificationRead(notification.notificationId)
    unreadCountFromServer.value = Number(response?.unreadCount ?? Math.max(unreadCountFromServer.value - 1, 0))
  } catch (error) {
    notification.isRead = false
    console.error(error)
  }
}

async function deleteAllNotifications() {
  if (notifications.value.length === 0) return

  try {
    const response = await deleteAllNotificationsApi()
    notifications.value = []
    unreadCountFromServer.value = Number(response?.unreadCount ?? 0)
    nextCursor.value = null
    hasNext.value = false
  } catch (error) {
    console.error(error)
  }
}

async function readAllNotifications() {
  if (unreadCountFromServer.value === 0) return

  try {
    const response = await markAllNotificationsRead()
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      isRead: true,
    }))
    unreadCountFromServer.value = Number(response?.unreadCount ?? 0)
  } catch (error) {
    console.error(error)
  }
}

async function refreshUnreadCount() {
  try {
    const response = await fetchNotificationUnreadCount()
    unreadCountFromServer.value = Number(response?.unreadCount ?? unreadCountFromServer.value)
  } catch (error) {
    console.error(error)
  }
}

function getTone(severity, type) {
  if (severity === 'HIGH') return 'critical'
  if (severity === 'MEDIUM') return 'warning'
  if (type === 'DELAY_RISK') return 'critical'
  if (type === 'SCHEDULE_APPLIED') return 'warning'
  if (type === 'REPORT_READY') return 'success'
  if (type === 'SYSTEM_ERROR') return 'danger'
  return 'success'
}

function getLevelLabel(severity, type) {
  if (type === 'DELAY_RISK') return '납기 위험'
  if (type === 'SCHEDULE_APPLIED') return '계획 변경'
  if (type === 'REPORT_READY') return '보고서'
  if (type === 'SYSTEM_ERROR') return '시스템'
  if (severity === 'HIGH') return '높음'
  if (severity === 'MEDIUM') return '보통'
  if (severity === 'LOW') return '낮음'
  return '알림'
}

function resolveNotificationUrl(item) {
  if (item.url) return item.url

  const referenceId = item.referenceId
  if (!referenceId) return '/'

  switch (item.referenceType) {
    case 'ORDER':
      return `/risk?orderId=${encodeURIComponent(referenceId)}`
    case 'PREDICTION':
      return `/risk?predictionId=${encodeURIComponent(referenceId)}`
    case 'MATERIAL':
      return `/materials/${encodeURIComponent(referenceId)}`
    case 'REPORT':
      return `/reports/${encodeURIComponent(referenceId)}`
    case 'PLAN':
      return `/plan?planId=${encodeURIComponent(referenceId)}`
    case 'LINE':
      return `/lines/${encodeURIComponent(referenceId)}`
    case 'MACHINE':
      return `/lines?machineId=${encodeURIComponent(referenceId)}`
    default:
      return '/'
  }
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
  const notification = {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    notificationId: null,
    title: String(detail.title ?? '새 알림'),
    message: String(detail.message || '새로운 알림이 도착했습니다.'),
    level: getToastLevel(type),
    tone: getToastTone(type),
    to: String(detail.to || router.currentRoute.value.fullPath || '/'),
    isRead: false,
    createdAt: new Date().toISOString(),
  }

  notifications.value = [notification, ...notifications.value].slice(0, 50)
}

async function connectSse() {
  if (reconnectTimer.value) {
    window.clearTimeout(reconnectTimer.value)
    reconnectTimer.value = null
  }

  eventSource.value?.close()
  try {
    eventSource.value = await createNotificationEventSource()
  } catch (error) {
    console.error(error)
    reconnectTimer.value = window.setTimeout(() => {
      refreshUnreadCount()
      connectSse()
    }, 3000)
    return
  }
  if (!eventSource.value) return

  eventSource.value.addEventListener('connected', (event) => {
    const data = parseEventData(event)
    unreadCountFromServer.value = Number(data?.unreadCount ?? unreadCountFromServer.value)
  })

  eventSource.value.addEventListener('notification', (event) => {
    const data = parseEventData(event)
    if (!data) return
    mergeNotifications([data])
    unreadCountFromServer.value += data.isRead === true ? 0 : 1
  })

  eventSource.value.addEventListener('unread-count', (event) => {
    const data = parseEventData(event)
    unreadCountFromServer.value = Number(data?.unreadCount ?? unreadCountFromServer.value)
  })

  eventSource.value.onerror = () => {
    eventSource.value?.close()
    eventSource.value = null
    reconnectTimer.value = window.setTimeout(() => {
      refreshUnreadCount()
      connectSse()
    }, 3000)
  }
}

function parseEventData(event) {
  try {
    return JSON.parse(event.data)
  } catch {
    return null
  }
}

function onDocumentClick(e) {
  if (alarmRef.value && !alarmRef.value.contains(e.target)) {
    closeAlarm()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  window.addEventListener(TOAST_NOTIFICATION_EVENT, addToastNotification)
  loadNotifications()
  connectSse()
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener(TOAST_NOTIFICATION_EVENT, addToastNotification)
  if (reconnectTimer.value) {
    window.clearTimeout(reconnectTimer.value)
  }
  eventSource.value?.close()
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
            :disabled="unreadCount === 0"
            @click="readAllNotifications"
          >
            모두 읽음
          </button>
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
          :class="{ 'is-read': notification.isRead }"
          @click="goToNotification(notification)"
        >
          <span v-if="!notification.isRead" class="app-alarm-item__dot" aria-hidden="true"></span>
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

        <button
          v-if="hasNext"
          type="button"
          class="app-alarm-item"
          :disabled="isLoading"
          @click="loadNotifications({ append: true })"
        >
          <span class="app-alarm-item__content">
            <strong>{{ isLoading ? '불러오는 중' : '더 보기' }}</strong>
            <small>이전 알림을 추가로 불러옵니다.</small>
          </span>
        </button>

        <div v-if="notifications.length === 0" class="app-alarm-empty">
          <strong>알림이 없습니다</strong>
          <small>새 알림이 도착하면 이곳에 표시됩니다.</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./styles/alarm-button.css"></style>
