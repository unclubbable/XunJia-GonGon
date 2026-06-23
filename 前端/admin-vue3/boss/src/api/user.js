import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/boss-user/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/boss-user/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/boss-user/logout',
    method: 'post'
  })
}
export function getTerminalList() { 
  return request({
    url:'/boss-user/Terminal',
    method: 'get',
  })
}
export function getTerminalByVehicleNo(keyword) { 
  return request({
    url:'/boss-user/Terminal/'+keyword,
    method: 'get',
  })
}
