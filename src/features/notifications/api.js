import { apiRequest } from '../../utils/api.js'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export function fetchNotifications({ cursor, size = 20 } = {}) {
  const params = new URLSearchParams()
  if (cursor !== null && cursor !== undefined && cursor !== '') {
    params.set('cursor', cursor)
  }
  params.set('size', String(size))

  return apiRequest(`/api/notifications?${params.toString()}`)
}

export function fetchNotificationUnreadCount() {
  return apiRequest('/api/notifications/unread-count')
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  })
}

export function markAllNotificationsRead() {
  return apiRequest('/api/notifications/read-all', {
    method: 'PATCH',
  })
}

export function deleteAllNotifications() {
  return apiRequest('/api/notifications', {
    method: 'DELETE',
  })
}

export function issueNotificationSseTicket() {
  return apiRequest('/api/notifications/sse-ticket', {
    method: 'POST',
  })
}

export async function createNotificationEventSource() {
  if (typeof EventSource === 'undefined') return null

  const response = await issueNotificationSseTicket()
  const ticket = response?.ticket
  if (!ticket) return null

  const query = new URLSearchParams({ ticket })
  return new EventSource(`${API_BASE_URL}/api/notifications/subscribe?${query.toString()}`)
}
