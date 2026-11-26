import { MsbRequest } from '../plugins/request'

/** 创建工单 */
export const ApiTicketCreate = (data) =>
  MsbRequest.post('/ticket/create', data, { repeat: true })

/** 我的工单列表 */
export const ApiTicketMyList = (params = {}) =>
  MsbRequest.get('/ticket/my-list', params)

/** 我的工单详情 */
export const ApiTicketMyDetail = (ticketId) =>
  MsbRequest.get('/ticket/my-detail', { ticketId })

/** 撤销工单 */
export const ApiTicketCancel = (ticketId) =>
  MsbRequest.post('/ticket/cancel', { ticketId }, {
    'content-type': 'application/x-www-form-urlencoded',
    repeat: true
  })

/** 补充说明 */
export const ApiTicketAppendMessage = (data) =>
  MsbRequest.post('/ticket/append-message', data, { repeat: true })
