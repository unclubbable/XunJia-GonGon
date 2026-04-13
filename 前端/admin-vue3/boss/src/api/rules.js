import request from '@/utils/request'

export function getDicDistrict(){
    return request({
      url:'/district',
      method: 'get'
    })
}

export function getRuleList(query) {
  return request({
    url: '/price-rule/list',
    method: 'get',
    params: query
  })
}

export function addRule(data) {
  return request({
    url: '/price-rule/add',
    method: 'post',
    data
  })
}

export function editRule(data) {
  return request({
    url: '/price-rule/edit',
    method: 'post',
    data
  })
}