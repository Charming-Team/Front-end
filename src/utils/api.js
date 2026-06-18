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

/**
 * 목적: fetch 응답 본문을 공통 API 래퍼에서 다룰 수 있는 형태로 파싱한다.
 * 입력: Fetch API의 Response 객체.
 * 출력: JSON 응답이면 파싱된 객체, 본문이 JSON이 아니면 null.
 * 처리 흐름:
 * 1. content-type 헤더가 application/json을 포함하는지 확인한다.
 * 2. JSON이면 response.json()으로 파싱하고, 그 외 응답은 본문을 소비하지 않는다.
 */
async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return null
}

/**
 * 목적: 파일 다운로드 응답의 Content-Disposition 헤더에서 파일명을 추출한다.
 * 입력: Content-Disposition 헤더 문자열.
 * 출력: UTF-8 또는 일반 filename 값, 찾지 못하면 빈 문자열.
 * 처리 흐름:
 * 1. RFC 5987 형식의 filename* 값을 우선 읽고 URL 디코딩한다.
 * 2. 디코딩 실패 시 원문을 사용한다.
 * 3. filename*이 없으면 일반 filename 값을 보조로 추출한다.
 */
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

/**
 * 목적: 요청마다 필요한 기본 헤더와 인증 헤더를 조립한다.
 * 입력: fetch 옵션, 액세스 토큰, 인증 생략 여부.
 * 출력: fetch에 전달할 Headers 객체.
 * 처리 흐름:
 * 1. 호출자가 전달한 headers를 우선 보존한다.
 * 2. body가 있고 Content-Type이 없으면 JSON 요청으로 간주한다.
 * 3. 인증 생략 요청이 아니고 토큰이 있으면 Authorization 헤더를 보강한다.
 */
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

/**
 * 목적: 백엔드 API 규약과 맞지 않는 JSON 필드를 사전에 탐지한다.
 * 입력: 검사할 JSON 값과 현재 필드 경로.
 * 출력: 규약 위반 메시지 배열.
 * 처리 흐름:
 * 1. 객체/배열을 재귀 순회한다.
 * 2. snake_case 필드명과 한글 상태 코드 전송을 위반으로 기록한다.
 * 3. 하위 필드의 위반 목록을 합쳐 반환한다.
 */
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

/**
 * 목적: API 요청 전 JSON body가 프론트-백엔드 계약을 지키는지 검증한다.
 * 입력: fetch 옵션.
 * 출력: 반환값 없음. 위반 시 ApiError를 throw.
 * 처리 흐름:
 * 1. JSON 문자열 body 요청인지 확인한다.
 * 2. JSON 파싱에 성공하면 필드명/코드값 규약을 검사한다.
 * 3. 위반 항목이 있으면 400 상태의 ApiError로 호출 흐름을 중단한다.
 */
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

/**
 * 목적: 액세스 토큰 만료 시 refresh token으로 새 토큰 쌍을 발급받는다.
 * 입력: localStorage에 저장된 refresh token.
 * 출력: 새 access token 문자열.
 * 처리 흐름:
 * 1. refresh token이 없으면 인증 만료 오류를 발생시킨다.
 * 2. 토큰 재발급 API를 호출하고 공통 응답 형식으로 성공 여부를 확인한다.
 * 3. access/refresh token을 저장소에 갱신하고 새 access token을 반환한다.
 */
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

/**
 * 목적: 동시에 여러 요청이 401을 받아도 토큰 재발급을 한 번만 수행한다.
 * 입력: 없음.
 * 출력: 진행 중이거나 새로 시작한 토큰 재발급 Promise.
 * 처리 흐름:
 * 1. 진행 중인 refreshPromise가 없으면 재발급 요청을 시작한다.
 * 2. 요청 종료 후 공유 Promise를 초기화한다.
 * 3. 모든 대기 요청이 같은 Promise 결과를 사용한다.
 */
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

/**
 * 목적: JSON 기반 API 호출에 인증, 토큰 재발급, 오류 정규화를 일괄 적용한다.
 * 입력: API path와 fetch 옵션(skipAuth, skipRefresh 포함 가능).
 * 출력: 성공 응답의 data 필드 또는 원 응답 payload.
 * 처리 흐름:
 * 1. 저장된 access token으로 요청을 보낸다.
 * 2. 401이면 refresh token으로 재발급한 뒤 한 번 재시도한다.
 * 3. 실패 응답은 사용자 메시지가 포함된 ApiError로 변환한다.
 * 4. 성공 시 백엔드 공통 응답의 data를 우선 반환한다.
 */
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

/**
 * 목적: 인증이 필요한 파일 다운로드 요청을 공통 방식으로 처리한다.
 * 입력: 파일 API path와 fetch 옵션(skipAuth, skipRefresh 포함 가능).
 * 출력: blob, contentType, filename을 담은 객체.
 * 처리 흐름:
 * 1. access token을 포함해 파일 요청을 보낸다.
 * 2. 401이면 토큰 재발급 후 한 번 재시도한다.
 * 3. 실패 응답은 ApiError로 변환한다.
 * 4. 성공 시 Blob 본문과 다운로드 메타데이터를 반환한다.
 */
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
