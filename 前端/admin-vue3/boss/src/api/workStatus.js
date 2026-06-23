import request from '@/utils/request'

export function getWorkStatus(){
  return request({
    url:'/driver-user-work-status',
    method: 'get'
  })
}

export function changeWorkStatus(query){
  return request({
    url:'/driver-user-work-status/change',
    method: 'get',
    params: query
  })
}