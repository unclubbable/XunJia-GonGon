export const TICKET_STATUS_MAP = {
  OPEN: '待受理',
  IN_PROGRESS: '处理中',
  PENDING_USER: '待补充',
  RESOLVED: '已解决',
  REJECTED: '已驳回',
  CANCELLED: '已撤销'
}

export const PASSENGER_CATEGORIES = [
  { value: 'DETOUR', label: '绕路投诉', needOrder: true },
  { value: 'OVERCHARGE', label: '多收费投诉', needOrder: true },
  { value: 'ATTITUDE', label: '态度投诉', needOrder: true },
  { value: 'CANCEL_DISPUTE', label: '取消纠纷', needOrder: true },
  { value: 'UNPAID_DISPUTE', label: '未支付争议', needOrder: true },
  { value: 'OTHER', label: '其他', needOrder: false }
]

export const ORDER_STATUS_TEXT = {
  1: '待接单',
  2: '已接单',
  3: '去接乘客',
  4: '到达上车点',
  5: '行程中',
  6: '待收款',
  7: '待支付',
  8: '已完成',
  9: '已取消'
}

export function statusText(status) {
  return TICKET_STATUS_MAP[status] || status || '-'
}

export function categoryLabel(list, value) {
  const hit = (list || []).find((i) => i.value === value)
  return hit ? hit.label : value
}

export function orderStatusText(status) {
  return ORDER_STATUS_TEXT[status] || `状态${status}`
}
