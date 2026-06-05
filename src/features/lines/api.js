import { apiRequest } from '../../utils/api.js'

function appendParam(params, key, value) {
  if (value === undefined || value === null || value === '' || value === 'all') return
  params.set(key, String(value))
}

export function fetchLineOperationStatuses({ page = 0, size = 5, lineId, status } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  appendParam(params, 'lineId', lineId)
  appendParam(params, 'status', status)

  return apiRequest(`/api/lines/operation-statuses?${params.toString()}`)
}

export function fetchLineMachineOperationStatuses({ lineId } = {}) {
  const params = new URLSearchParams()
  appendParam(params, 'lineId', lineId)

  const query = params.toString()
  return apiRequest(`/api/lines/machine-operation-statuses${query ? `?${query}` : ''}`)
}

export function searchLineOrders({ page = 0, size = 5, keyword } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  appendParam(params, 'keyword', keyword?.trim())

  return apiRequest(`/api/lines/orders/search?${params.toString()}`)
}

export function fetchOrderDistribution(orderId) {
  return apiRequest(`/api/lines/orders/${encodeURIComponent(orderId)}/distribution`)
}
