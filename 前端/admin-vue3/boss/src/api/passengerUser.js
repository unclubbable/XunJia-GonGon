import request from '@/utils/request'

export function getDicDistrict(){
    return request({
      url:'/district',
      method: 'get'
    })
}

export function fetchList(query) {
  return request({
    url: '/passenger-user/list',
    method: 'get',
    params: query
  })
}