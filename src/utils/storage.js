const TOKEN_KEY = 's_map_token'
const USER_ROLE_KEY = 's_map_user_role'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const getUserRole = () => localStorage.getItem(USER_ROLE_KEY)
export const setUserRole = (role) => localStorage.setItem(USER_ROLE_KEY, role)
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
}
