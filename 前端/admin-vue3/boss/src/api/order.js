import request from '@/utils/request'

export function getOrderList(query){
  return request({
    url:'/order/get-order-list',
    method: 'get',
    params: query
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