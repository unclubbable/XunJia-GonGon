import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'

const TOKEN_ERROR_CODES = [1199, 1198]

function getErrorMessage(code, defaultMessage) {
  const map = {
    1199: '登录已过期，请重新登录',
    1198: '身份验证失败',
    1700: defaultMessage || '参数校验失败',
    1701: defaultMessage || '参数错误',
    1800: '系统繁忙，请稍后重试',
    1900: '工单不存在',
    1901: '工单类型不合法',
    1902: '工单状态不允许此操作',
    1903: '无权操作该工单',
    1904: '已有处理中的同类工单',
    1905: '该类型工单必须关联订单',
    1906: '订单与当前用户不匹配',
    1907: '申请内容不完整',
    1908: '工单已被他人更新，请刷新',
    1909: '该订单已有未完结退款单',
    1910: '退款金额不合法',
    1911: '仅已支付订单可登记退款',
    1912: '执行资料/城市变更失败',
    1913: 'AI协查尚未开通',
    1914: 'AI服务暂时不可用',
    1915: 'AI会话处理失败',
  }
  return map[code] || defaultMessage || '操作失败'
}

const service = axios.create({
  baseURL: '/api',
  timeout: 5000
})

service.interceptors.request.use(
  config => {
    if (getToken()) {
      config.headers['X-Token'] = getToken()
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data

    if (res.code !== 1) {
      const message = getErrorMessage(res.code, res.message)
      ElMessage({
        message,
        type: 'error',
        duration: 5 * 1000
      })
      if (TOKEN_ERROR_CODES.includes(res.code)) {
        // 管理端可在此跳转登录
      }
      return Promise.reject(new Error(message))
    }
    return res
  },
  error => {
    console.log('err' + error)
    if (error.response?.status === 401 && error.response?.data) {
      const res = error.response.data
      const message = getErrorMessage(res.code, res.message)
      ElMessage({ message, type: 'error', duration: 5 * 1000 })
      return Promise.reject(new Error(message))
    }
    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
