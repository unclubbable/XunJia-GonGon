import request from '@/utils/request'

export function getOrderList(query){
  return request({
    url:'/order/get-order-list',
    method: 'get',
    params: query
  })
}

/** 嵌套订单详情 { order, trip }，管理端专用 */
export function getOrderDetailNested(orderId) {
  return request({
    url: '/order/detail-nested',
    method: 'get',
    params: { orderId }
  })
}

export function updateOrder(data){
    return request({
        url: '/order/update',
        method: 'post',
        data
    })
}

export function getDicDistrict(){
  return request({
    url: '/district',
    method: 'get'
  })
}