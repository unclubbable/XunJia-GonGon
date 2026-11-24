const TokenKey = 'admin_token'
const UserIdKey = 'admin_user_id'
const UsernameKey = 'admin_username'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
}

export function getUserId() {
  const v = localStorage.getItem(UserIdKey)
  return v ? Number(v) : null
}

export function setUserId(userId) {
  if (userId == null) {
    localStorage.removeItem(UserIdKey)
    return
  }
  localStorage.setItem(UserIdKey, String(userId))
}

export function getUsername() {
  return localStorage.getItem(UsernameKey) || ''
}

export function setUsername(username) {
  if (!username) {
    localStorage.removeItem(UsernameKey)
    return
  }
  localStorage.setItem(UsernameKey, username)
}

/** 被挤下线 / 登出时清理本地会话 */
export function clearSession() {
  removeToken()
  setUserId(null)
  setUsername('')
}
