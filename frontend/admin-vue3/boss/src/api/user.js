import request from '@/utils/request'

/** 获取登录 RSA 公钥（PEM） */
export function getLoginPublicKey() {
  return request({
    url: '/login/public-key',
    method: 'get'
  })
}

export function login(data) {
  return request({
    url: '/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/logout',
    method: 'post'
  })
}
export function getTerminalList() { 
  return request({
    url:'/Terminal',
    method: 'get',
  })
}
export function getTerminalByVehicleNo(keyword) { 
  return request({
    url:'/Terminal/'+keyword,
    method: 'get',
  })
}
