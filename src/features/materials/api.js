import { apiRequest } from '../../utils/api.js'

export function fetchMaterials({ page = 0, size = 100 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })

  return apiRequest(`/api/materials?${params.toString()}`)
}
