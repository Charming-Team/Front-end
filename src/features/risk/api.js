import { apiRequest } from '../../utils/api.js';

function unwrapBaseResponse(response) {
  if (response && response.success === true && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }

  if (response && response.data && response.data.success === true && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
    return response.data.data;
  }

  return response;
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  if (params.riskLevel) {
    query.set('riskLevel', params.riskLevel);
  }

  if (params.keyword) {
    query.set('keyword', params.keyword);
  }

  query.set('page', String(params.page ?? 0));
  query.set('size', String(params.size ?? 20));

  return query.toString();
}

export async function fetchRiskSummary() {
  const response = await apiRequest('/api/risks/summary');
  return unwrapBaseResponse(response);
}

export async function fetchRiskOrders(params = {}) {
  const queryString = buildQueryString(params);
  const response = await apiRequest(`/api/risks/orders?${queryString}`);
  return unwrapBaseResponse(response);
}

export async function fetchRiskOrderDetail(orderId) {
  if (orderId === null || orderId === undefined || orderId === '') {
    throw new Error('orderId is required');
  }

  const response = await apiRequest(`/api/risks/orders/${encodeURIComponent(orderId)}`);
  return unwrapBaseResponse(response);
}
