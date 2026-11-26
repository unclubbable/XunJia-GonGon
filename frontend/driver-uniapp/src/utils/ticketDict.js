export const TICKET_STATUS_MAP = {
  OPEN: '待受理',
  IN_PROGRESS: '处理中',
  PENDING_USER: '待补充',
  RESOLVED: '已解决',
  REJECTED: '已驳回',
  CANCELLED: '已撤销'
}

export const DRIVER_CATEGORIES = [
  { value: 'CHANGE_CITY', label: '申请修改运营城市', needOrder: false, needPayload: true },
  { value: 'CHANGE_PROFILE', label: '申请修改个人信息', needOrder: false, needPayload: true },
  { value: 'BIND_VEHICLE', label: '绑定/换绑车辆', needOrder: false, needPayload: true },
  { value: 'ORDER_ISSUE', label: '订单问题', needOrder: true },
  { value: 'RULE_QA', label: '平台准则咨询', needOrder: false },
  { value: 'SALARY_QA', label: '工资组成咨询', needOrder: false },
  { value: 'OTHER', label: '其他', needOrder: false }
]

/** 改资料可勾选字段 */
export const PROFILE_FIELD_OPTIONS = [
  { key: 'driverSurname', label: '姓', type: 'text', placeholder: '新姓氏' },
  { key: 'driverName', label: '名', type: 'text', placeholder: '新名字' },
  { key: 'driverGender', label: '性别', type: 'gender' },
  { key: 'driverNation', label: '民族', type: 'text', placeholder: '如 汉' },
  { key: 'driverBirthday', label: '出生日期', type: 'date', placeholder: '请选择出生日期' },
  { key: 'driverContactAddress', label: '通信地址', type: 'text', placeholder: '新联系地址' }
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
