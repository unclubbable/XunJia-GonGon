import request from '@/utils/request'

export function getCarList(query){
  return request({
    url:'/driver-user/car/list',
    method: 'get',
    params: query
  })
}

export function createOrUpdateCar(data){
  return request({
    url:'/driver-user/car',
    method: 'post',
    data
  })
}

export function getCar(cid){
  return request({
    url:'/driver-user/get-car/'+cid,
    method: 'get'
  })
}
export function deleteCar(cid){
  return request({
    url:'/driver-user/car/'+cid,
    method: 'delete'
  })
}

export function getDicDistrict(){
  return request({
    url:'/district',
    method: 'get'
  })
}
