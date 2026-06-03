const TOKEN_KEY = 's_map_token'
const REFRESH_TOKEN_KEY = 's_map_refresh_token'
const USER_ROLE_KEY = 's_map_user_role'
const USER_INFO_KEY = 's_map_user_info'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)
export const setRefreshToken = (t) => localStorage.setItem(REFRESH_TOKEN_KEY, t)
export const getUserRole = () => localStorage.getItem(USER_ROLE_KEY)
export const setUserRole = (role) => localStorage.setItem(USER_ROLE_KEY, role)
export const getUserInfo = () => {
  const raw = localStorage.getItem(USER_INFO_KEY)
  return raw ? JSON.parse(raw) : null
}
export const setUserInfo = (user) => localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}
