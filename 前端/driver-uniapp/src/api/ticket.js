import { MsbRequest } from '../plugins/request'

export const ApiTicketCreate = (data) =>
  MsbRequest.post('/ticket/create', data, { repeat: true })

export const ApiTicketMyList = (params = {}) =>
  MsbRequest.get('/ticket/my-list', params)

export const ApiTicketMyDetail = (ticketId) =>
  MsbRequest.get('/ticket/my-detail', { ticketId })

export const ApiTicketCancel = (ticketId) =>
  MsbRequest.post('/ticket/cancel', { ticketId }, {
    'content-type': 'application/x-www-form-urlencoded',
    repeat: true
  })

export const ApiTicketAppendMessage = (data) =>
  MsbRequest.post('/ticket/append-message', data, { repeat: true })

/** 可切换运营城市（计价表 + 当前绑定车型） */
export const ApiTicketOperableCities = () =>
  MsbRequest.get('/ticket-helper/operable-cities')

/** 当前运营区域可绑定/换绑车辆 */
export const ApiTicketBindableCars = () =>
  MsbRequest.get('/ticket-helper/bindable-cars')
