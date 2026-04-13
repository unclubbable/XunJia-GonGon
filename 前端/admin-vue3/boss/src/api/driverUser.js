import request from '@/utils/request'

export function getDriverUserByDriverId(DriverId) {
  return request({
    url: '/get-driver-info/' + DriverId,
    method: 'get'
  })
}


export function createOrUpdateDriverUser(data) {
  return request({
    url: '/driver-user',
    method: 'post',
    data
  })
}

export function getDriverUserList(query){
  return request({
    url:'/driver-user/list',
    method: 'get',
    params: query
  })
}



export function getDicDistrict(){
  return request({
    url:'/district',
    method: 'get'
  })
}

