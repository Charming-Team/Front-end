import { clearToken, getRefreshToken, getToken, setRefreshToken, setToken } from './storage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
let refreshPromise = null

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.data = data
  }
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

function parseFilenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) return ''

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      return encodedMatch[1]
    }
  }

  const fallbackMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return fallbackMatch?.[1] || ''
}

function buildHeaders(fetchOptions, token, skipAuth) {
  const headers = new Headers(fetchOptions.headers || {})

  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (!skipAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

async function requestTokenRefresh() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new ApiError('로그인이 만료되었습니다. 다시 로그인해주세요.', { status: 401 })
  }

  const response = await fetch(`${API_BASE_URL}/api/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
  const payload = await parseResponse(response)

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message || '로그인이 만료되었습니다. 다시 로그인해주세요.', {
      status: response.status,
      code: payload?.code,
      data: payload?.data,
    })
  }

  const tokenData = payload?.data
  if (!tokenData?.accessToken || !tokenData?.refreshToken) {
    throw new ApiError('토큰 재발급 응답이 올바르지 않습니다.', { status: response.status })
  }

  setToken(tokenData.accessToken)
  setRefreshToken(tokenData.refreshToken)

  return tokenData.accessToken
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiRequest(path, options = {}) {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options
  const token = getToken()
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(fetchOptions, token, skipAuth),
  })
  let payload = await parseResponse(response)

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      const refreshedToken = await refreshAccessToken()
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: buildHeaders(fetchOptions, refreshedToken, false),
      })
      payload = await parseResponse(response)
    } catch (err) {
      clearToken()
      redirectToLogin()
      throw err
    }
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

export async function apiFileRequest(path, options = {}) {
  const { skipAuth = false, skipRefresh = false, ...fetchOptions } = options
  const token = getToken()
  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(fetchOptions, token, skipAuth),
  })

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      const refreshedToken = await refreshAccessToken()
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers: buildHeaders(fetchOptions, refreshedToken, false),
      })
    } catch (err) {
      clearToken()
      redirectToLogin()
      throw err
    }
  }

  if (!response.ok) {
    const payload = await parseResponse(response)
    throw new ApiError(payload?.message || '파일 다운로드 중 오류가 발생했습니다.', {
      status: response.status,
      code: payload?.code,
      data: payload?.data,
    })
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get('content-type') || '',
    filename: parseFilenameFromContentDisposition(
      response.headers.get('content-disposition')
    ),
  }
}
