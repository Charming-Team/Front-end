const STORAGE_KEY = 'smap.aiSimulationSession'

function getStorage() {
  if (typeof window === 'undefined') return null
  return window.sessionStorage
}

function normalizeSession(value = {}) {
  return {
    response: value.response ?? null,
    options: Array.isArray(value.options) ? value.options : [],
    conflict: value.conflict ?? null,
    selectedVariantCode: value.selectedVariantCode ?? '',
    diagnosticMessage: value.diagnosticMessage ?? '',
    savedAt: value.savedAt ?? null,
  }
}

export function saveAiSimulationSession(payload = {}) {
  const storage = getStorage()
  if (!storage) return

  const session = normalizeSession({
    ...payload,
    savedAt: new Date().toISOString(),
  })

  storage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function updateAiSimulationSession(patch = {}) {
  const previous = loadAiSimulationSession()
  saveAiSimulationSession({
    ...previous,
    ...patch,
  })
}

export function loadAiSimulationSession() {
  const storage = getStorage()
  if (!storage) return normalizeSession()

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return normalizeSession()
    return normalizeSession(JSON.parse(raw))
  } catch {
    return normalizeSession()
  }
}

export function clearAiSimulationSession() {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(STORAGE_KEY)
}
