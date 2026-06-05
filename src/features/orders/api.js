import { apiRequest } from '../../utils/api.js'

function appendParam(params, key, value) {
  if (value === undefined || value === null || value === '' || value === 'all') return
  params.set(key, String(value))
}

export function fetchOrders({
  page = 0,
  size = 10,
  keyword,
  status,
  customerName,
  productId,
  dueDateFrom,
  dueDateTo,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  appendParam(params, 'keyword', keyword?.trim())
  appendParam(params, 'status', status)
  appendParam(params, 'customerName', customerName)
  appendParam(params, 'productId', productId)
  appendParam(params, 'dueDateFrom', dueDateFrom)
  appendParam(params, 'dueDateTo', dueDateTo)

  return apiRequest(`/api/orders?${params.toString()}`)
}

export function fetchOrder(orderId) {
  return apiRequest(`/api/orders/${encodeURIComponent(orderId)}`)
}

export function fetchNextOrderNo() {
  return apiRequest('/api/orders/next-order-no')
}

export function createOrder(payload) {
  return apiRequest('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
