import request from '@/utils/request'

export function putMoneyById(data) {
  return request({
    url: '/driver-user-money',
    method: 'put',
    data
  })
}

export function getMoneyList(){
  return request({
    url:'/driver-user-money',
    method: 'get'
  })
}

export function getMoneyBydriverIdRecentlyMonth(driverId, RecentlyMonth){
  return request({
    url:`/driver-user-money/${driverId}/${RecentlyMonth}`,
    method: 'get'
  })
}