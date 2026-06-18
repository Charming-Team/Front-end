import { clearToken, getRefreshToken, getToken, setRefreshToken, setToken } from './storage.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
let refreshPromise = null

const ERROR_MESSAGES_BY_STATUS = {
  400: '입력값을 확인해주세요.',
  401: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  403: '해당 기능에 접근할 권한이 없습니다.',
  404: '요청한 정보를 찾을 수 없습니다.',
  409: '현재 상태에서는 처리할 수 없습니다.',
  422: '업무 규칙상 처리할 수 없습니다.',
  500: '서버 오류가 발생했습니다.',
  502: 'AI 서버 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
  504: 'AI 서버 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
}

const KOREAN_TEXT_PATTERN = /[가-힣]/
const CODE_VALUE_FIELDS = new Set(['riskLevel'])

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

function getErrorMessage(status, payload, fallbackMessage) {
  return ERROR_MESSAGES_BY_STATUS[status] || payload?.message || fallbackMessage
}

function isJsonRequest(fetchOptions = {}) {
  if (!fetchOptions.body || typeof fetchOptions.body !== 'string') return false

  const headers = new Headers(fetchOptions.headers || {})
  return !headers.has('Content-Type') || headers.get('Content-Type')?.includes('application/json')
}

function isCodeValueField(key) {
  return CODE_VALUE_FIELDS.has(key) || key.endsWith('Status')
}

function collectJsonConventionViolations(value, path = '') {
  if (!value || typeof value !== 'object') return []

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectJsonConventionViolations(item, `${path}[${index}]`))
  }

  return Object.entries(value).flatMap(([key, fieldValue]) => {
    const fieldPath = path ? `${path}.${key}` : key
    const violations = []

    if (key.includes('_')) {
      violations.push(`${fieldPath}: API JSON 필드는 camelCase를 사용해야 합니다.`)
    }

    if (
      typeof fieldValue === 'string'
      && isCodeValueField(key)
      && KOREAN_TEXT_PATTERN.test(fieldValue)
    ) {
      violations.push(`${fieldPath}: API에는 한글 상태값 대신 코드값을 전송해야 합니다.`)
    }

    return violations.concat(collectJsonConventionViolations(fieldValue, fieldPath))
  })
}

function validateRequestBody(fetchOptions) {
  if (!isJsonRequest(fetchOptions)) return

  let payload = null
  try {
    payload = JSON.parse(fetchOptions.body)
  } catch {
    return
  }

  const violations = collectJsonConventionViolations(payload)
  if (violations.length === 0) return

  throw new ApiError('API 요청 JSON 형식을 확인해주세요.', {
    status: 400,
    data: { violations },
  })
}

function buildRequestInit(fetchOptions, token, skipAuth) {
  validateRequestBody(fetchOptions)

  return {
    ...fetchOptions,
    headers: buildHeaders(fetchOptions, token, skipAuth),
  }
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
  let response = await fetch(`${API_BASE_URL}${path}`, buildRequestInit(fetchOptions, token, skipAuth))
  let payload = await parseResponse(response)

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      const refreshedToken = await refreshAccessToken()
      response = await fetch(`${API_BASE_URL}${path}`, buildRequestInit(fetchOptions, refreshedToken, false))
      payload = await parseResponse(response)
    } catch (err) {
      clearToken()
      redirectToLogin()
      throw err
    }
  }

  if (!response.ok || payload?.success === false) {
    if (response.status === 401) {
      clearToken()
      redirectToLogin()
    }

    throw new ApiError(getErrorMessage(response.status, payload, '요청 처리 중 오류가 발생했습니다.'), {
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
  let response = await fetch(`${API_BASE_URL}${path}`, buildRequestInit(fetchOptions, token, skipAuth))

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    try {
      const refreshedToken = await refreshAccessToken()
      response = await fetch(`${API_BASE_URL}${path}`, buildRequestInit(fetchOptions, refreshedToken, false))
    } catch (err) {
      clearToken()
      redirectToLogin()
      throw err
    }
  }

  if (!response.ok) {
    const payload = await parseResponse(response)
    if (response.status === 401) {
      clearToken()
      redirectToLogin()
    }

    throw new ApiError(getErrorMessage(response.status, payload, '파일 다운로드 중 오류가 발생했습니다.'), {
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
