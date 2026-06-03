import { getToken } from './storage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options
  const token = getToken()
  const headers = new Headers(fetchOptions.headers || {})

  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  })

  let payload = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    payload = await response.json()
  }

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || '요청 처리 중 오류가 발생했습니다.', {
      status: response.status,
      code: payload?.code,
      data: payload?.data,
    })
  }

  return payload?.data ?? payload
}
