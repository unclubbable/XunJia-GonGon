import { ElMessage } from 'element-plus'
import router from '@/router'
import { clearSession } from '@/utils/auth'
import { stopAdminWs } from '@/utils/wsHub'

let kicking = false

/**
 * 统一被挤 / 会话失效处理（HTTP 1197 与 WS FORCE_LOGOUT 共用）
 * @param {string} reason
 * @param {{ toast?: boolean }} options  HTTP 拦截器已 toast 时可关
 */
export function handleKicked(reason = '账号已在别处登录', options = {}) {
  const { toast = true } = options
  if (kicking) return
  kicking = true
  try {
    stopAdminWs()
    clearSession()
    if (toast) {
      ElMessage.warning(reason)
    }
    const path = router.currentRoute?.value?.path
    if (path !== '/login') {
      router.replace('/login').finally(() => {
        kicking = false
      })
      return
    }
  } catch (e) {
    console.error('[kick]', e)
  }
  kicking = false
}
