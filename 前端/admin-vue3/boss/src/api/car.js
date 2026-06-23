import request from '@/utils/request'

export function getCarList(query){
  return request({
    url:'/car/list',
    method: 'get',
    params: query
  })
}

export function createOrUpdateCar(data){
  return request({
    url:'/car',
    method: 'post',
    data
  })
}

export function getCar(cid){
  return request({
    url:'/get-car/'+cid,
    method: 'get'
  })
}
export function deleteCar(cid){
  return request({
    url:'/car/'+cid,
    method: 'delete'
  })
}

export function getDicDistrict(){
  return request({
    url:'/district',
    method: 'get'
  })
}