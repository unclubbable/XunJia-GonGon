import request from '@/utils/request'

export function initDicDistrict(keywords){
  return request({
    url:'/dic-district/'+keywords,
    method: 'get'
  })
}

export function deleteDicDistrict(keywords){
    return request({
        url: '/dic-district/'+keywords,
        method: 'delete'
    })
}
export function getDicDistrictlist(){
  return request({
    url:'/dic-district/list',
    method: 'get'
  })
}
export function getDicDistrictlistprovince(){
  return request({
    url:'/dic-district/listprovince',
    method: 'get'
  })
}