import { apiRequest } from '../../utils/api.js'

export function login({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })
}

export function fetchMe() {
  return apiRequest('/api/auth/me')
}
