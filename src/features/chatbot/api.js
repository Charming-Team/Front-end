import { apiRequest } from '../../utils/api.js'

export function requestChatAnswer({ question, sessionId, messageId }) {
  return apiRequest('/api/chat/answer', {
    method: 'POST',
    body: JSON.stringify({
      question,
      sessionId,
      messageId,
    }),
  })
}
