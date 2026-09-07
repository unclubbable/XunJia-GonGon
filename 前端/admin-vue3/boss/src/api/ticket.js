import request from '@/utils/request'

export function getTicketList(params) {
  return request({
    url: '/ticket/list',
    method: 'get',
    params
  })
}

export function getTicketDetail(ticketId) {
  return request({
    url: '/ticket/detail',
    method: 'get',
    params: { ticketId }
  })
}

export function acceptTicket(data) {
  return request({
    url: '/ticket/accept',
    method: 'post',
    data
  })
}

export function replyTicket(data) {
  return request({
    url: '/ticket/reply',
    method: 'post',
    data
  })
}

export function resolveTicket(data) {
  return request({
    url: '/ticket/resolve',
    method: 'post',
    data
  })
}

export function rejectTicket(data) {
  return request({
    url: '/ticket/reject',
    method: 'post',
    data
  })
}

export function approveExecuteTicket(data) {
  return request({
    url: '/ticket/approve-execute',
    method: 'post',
    data
  })
}

export function createTicketRefund(data) {
  return request({
    url: '/ticket/refund/create',
    method: 'post',
    data
  })
}

export function executeTicketRefund(data) {
  return request({
    url: '/ticket/refund/execute',
    method: 'post',
    data
  })
}

export function rejectTicketRefund(data) {
  return request({
    url: '/ticket/refund/reject',
    method: 'post',
    data
  })
}

export function getRefundList(params) {
  return request({
    url: '/ticket/refund/list',
    method: 'get',
    params
  })
}

export function getRefundDetail(refundId) {
  return request({
    url: '/ticket/refund/detail',
    method: 'get',
    params: { refundId }
  })
}

/** AI 协查，120s 超时 */
export function ticketAiAssist(data) {
  return request({
    url: '/ticket/ai/assist',
    method: 'post',
    data,
    timeout: 120000
  })
}

/** AI 多轮问答 */
export function ticketAiChat(data) {
  return request({
    url: '/ticket/ai/chat',
    method: 'post',
    data,
    timeout: 120000
  })
}
