/**
 * 工单/退款前端常量与文案映射
 */
export const TICKET_STATUS_MAP = {
  OPEN: '待受理',
  IN_PROGRESS: '处理中',
  PENDING_USER: '待用户补充',
  RESOLVED: '已解决',
  REJECTED: '已驳回',
  CANCELLED: '已撤销'
}

export const TICKET_STATUS_TAG = {
  OPEN: 'warning',
  IN_PROGRESS: 'primary',
  PENDING_USER: 'info',
  RESOLVED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'info'
}

export const TICKET_SOURCE_MAP = {
  1: '乘客',
  2: '司机'
}

export const PASSENGER_CATEGORY_MAP = {
  DETOUR: '绕路投诉',
  OVERCHARGE: '多收费投诉',
  ATTITUDE: '态度投诉',
  CANCEL_DISPUTE: '取消纠纷',
  UNPAID_DISPUTE: '未支付争议',
  OTHER: '其他'
}

export const DRIVER_CATEGORY_MAP = {
  CHANGE_CITY: '申请修改运营城市',
  CHANGE_PROFILE: '申请修改个人信息',
  BIND_VEHICLE: '绑定/换绑车辆',
  ORDER_ISSUE: '订单问题',
  RULE_QA: '平台准则咨询',
  SALARY_QA: '工资组成咨询',
  OTHER: '其他'
}

/** 管理端支持「通过并执行」的司机工单类型 */
export const EXECUTABLE_DRIVER_CATEGORIES = ['CHANGE_CITY', 'CHANGE_PROFILE', 'BIND_VEHICLE']

export const ALL_CATEGORY_MAP = {
  ...PASSENGER_CATEGORY_MAP,
  ...DRIVER_CATEGORY_MAP
}

export const REFUND_STATUS_MAP = {
  PENDING: '待执行',
  APPROVED: '待执行(旧)',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  FAILED: '退款失败',
  REJECTED: '已驳回'
}

export const REFUND_CHANNEL_MAP = {
  MANUAL: '手动退款',
  ALIPAY: '支付宝原路退'
}

/** 可在退款页执行的状态 */
export const REFUND_EXECUTABLE_STATUSES = ['PENDING', 'APPROVED', 'REFUNDING', 'FAILED']

export const REFUND_REJECTABLE_STATUSES = ['PENDING', 'APPROVED', 'FAILED']

export const ORDER_REFUND_STATUS_MAP = {
  0: '无退款',
  1: '退款中',
  2: '部分退款',
  3: '全额退款'
}

export const ORDER_REFUND_STATUS_TAG = {
  0: 'info',
  1: 'warning',
  2: 'warning',
  3: 'success'
}

export const ACTIVE_TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING_USER']

export function formatCategory(category) {
  return ALL_CATEGORY_MAP[category] || category || '-'
}

export function formatTicketStatus(status) {
  return TICKET_STATUS_MAP[status] || status || '-'
}
