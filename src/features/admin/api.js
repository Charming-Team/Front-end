import { apiRequest } from '../../utils/api.js'

export function fetchAdminDashboard() {
  return apiRequest('/api/admin/dashboard')
}
