import request from '@/utils/request'

export function getBindingList(query){
  return request({
    url:'/driver_car_binging_relationship/list',
    method: 'get',
    params: query
  })
}

export function binding(data){
  return request({
    url:'/driver_car_binging_relationship/bind',
    method: 'post',
    data
  })
}

export function unbinding(data){
  return request({
    url:'/driver_car_binging_relationship/unbind',
    method: 'post',
    data
  })
}
