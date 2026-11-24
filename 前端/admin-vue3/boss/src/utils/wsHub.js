/**
 * 管理端全局 WebSocket（identity=3）。
 * 事件：ticket / ticketCreated / ticketCancelled / forceLogout / unknown / status
 */
import { getToken, getUserId } from '@/utils/auth'

const TICKET_TYPES = ['TICKET_MESSAGE', 'TICKET_STATUS', 'TICKET_CREATED']

const listeners = {
  ticket: new Set(),
  ticketCreated: new Set(),
  ticketCancelled: new Set(),
  forceLogout: new Set(),
  unknown: new Set(),
  status: new Set()
}

/** @type {WebSocket | null} */
let socket = null
let heartTimer = null
let reconnectTimer = null
let reconnectCount = 0
let manualClose = false
let started = false
let connectGeneration = 0
/** @type {'idle'|'connecting'|'connected'|'reconnecting'|'failed'} */
let connStatus = 'idle'
let nextRetryDelayMs = 0

const HEART_INTERVAL_MS = 10000
const MAX_RECONNECT = 10
const BASE_RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_DELAY_MS = 30000
/** 达到快速重连上限后，仍按该间隔慢速重试，避免服务恢复后提示一直不消 */
const SLOW_RETRY_MS = 15000

function wsBase() {
  const raw = import.meta.env.VITE_WS_BASE || 'ws://127.0.0.1:9000'
  return String(raw).replace(/\/$/, '')
}

export function onWs(event, handler) {
  const set = listeners[event]
  if (!set || typeof handler !== 'function') {
    return () => {}
  }
  set.add(handler)
  return () => set.delete(handler)
}

function emit(event, payload) {
  listeners[event]?.forEach((fn) => {
    try {
      fn(payload)
    } catch (e) {
      console.error('[管理端WS] listener error', e)
    }
  })
}

function setConnStatus(status, extra = {}) {
  connStatus = status
  if (extra.nextRetryDelayMs != null) {
    nextRetryDelayMs = extra.nextRetryDelayMs
  }
  if (status === 'connected' || status === 'idle' || status === 'connecting') {
    nextRetryDelayMs = 0
  }
  emit('status', getWsStatus())
}

export function getWsStatus() {
  return {
    status: connStatus,
    reconnectCount,
    maxReconnect: MAX_RECONNECT,
    nextRetryDelayMs,
    started
  }
}

function stopHeartBeat() {
  if (heartTimer) {
    clearInterval(heartTimer)
    heartTimer = null
  }
}

function startHeartBeat() {
  stopHeartBeat()
  heartTimer = setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    try {
      socket.send(JSON.stringify({ type: 'heartBeat' }))
    } catch (e) {
      console.warn('[管理端WS] 心跳失败', e)
    }
  }, HEART_INTERVAL_MS)
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function closeSocket(isManual = false) {
  manualClose = isManual
  clearReconnectTimer()
  stopHeartBeat()
  connectGeneration += 1
  const prev = socket
  socket = null
  if (prev) {
    try {
      prev.close()
    } catch (e) {
      // ignore
    }
  }
  if (isManual) {
    setConnStatus(started ? 'idle' : 'idle')
  }
}

function scheduleReconnect(userId) {
  if (manualClose || !userId || !started) return
  let delay
  if (reconnectCount >= MAX_RECONNECT) {
    delay = SLOW_RETRY_MS
    setConnStatus('failed', { nextRetryDelayMs: delay })
    console.warn('[管理端WS] 快速重连已用尽，转为慢速重试', delay)
  } else {
    delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectCount),
      MAX_RECONNECT_DELAY_MS
    )
    reconnectCount += 1
    setConnStatus('reconnecting', { nextRetryDelayMs: delay })
  }
  clearReconnectTimer()
  reconnectTimer = setTimeout(() => connect(userId), delay)
}

function dispatchMessage(raw) {
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.error('[管理端WS] 解析失败', e)
    return
  }
  if (data.type === 'pong') return

  if (data.type === 'FORCE_LOGOUT') {
    emit('forceLogout', data.payload || { reason: 'OTHER_LOGIN' })
    return
  }
  if (data.type && data.payload !== undefined) {
    if (TICKET_TYPES.includes(data.type)) {
      const payload = { type: data.type, ...data.payload }
      emit('ticket', payload)
      if (data.type === 'TICKET_CREATED') {
        emit('ticketCreated', payload)
      }
      if (data.type === 'TICKET_STATUS' && payload.status === 'CANCELLED') {
        emit('ticketCancelled', payload)
      }
      return
    }
    emit('unknown', data)
    return
  }
  emit('unknown', data)
}

function connect(userId) {
  const token = getToken()
  if (!userId || !token) {
    console.warn('[管理端WS] 缺少 userId 或 token')
    setConnStatus('idle')
    return
  }
  closeSocket(false)
  manualClose = false
  setConnStatus(reconnectCount > 0 ? 'reconnecting' : 'connecting')
  const generation = connectGeneration
  const url = `${wsBase()}/connect/${userId}/3?token=${encodeURIComponent(token)}`
  console.log('[管理端WS] 连接：', `${wsBase()}/connect/${userId}/3?token=***`)

  let task
  try {
    task = new WebSocket(url)
  } catch (e) {
    console.error('[管理端WS] 创建失败', e)
    scheduleReconnect(userId)
    return
  }
  socket = task

  task.onopen = () => {
    if (generation !== connectGeneration || socket !== task) return
    console.log('[管理端WS] 已连接')
    reconnectCount = 0
    setConnStatus('connected')
    startHeartBeat()
  }

  task.onmessage = (ev) => {
    if (generation !== connectGeneration || socket !== task) return
    dispatchMessage(ev.data)
  }

  task.onclose = () => {
    if (generation !== connectGeneration) return
    console.log('[管理端WS] 连接关闭')
    stopHeartBeat()
    if (socket === task) socket = null
    if (!manualClose && started) scheduleReconnect(userId)
    else if (manualClose) setConnStatus('idle')
  }

  task.onerror = (err) => {
    if (generation !== connectGeneration) return
    console.warn('[管理端WS] 连接错误', err)
  }
}

export function startAdminWs() {
  const userId = getUserId()
  started = true
  reconnectCount = 0
  if (!userId || !getToken()) {
    closeSocket(true)
    setConnStatus('idle')
    return
  }
  connect(userId)
}

export function stopAdminWs() {
  started = false
  closeSocket(true)
  setConnStatus('idle')
}

/** 手动重试（失败或重连中均可点） */
export function retryAdminWs() {
  const userId = getUserId()
  if (!userId || !getToken()) {
    setConnStatus('idle')
    return
  }
  started = true
  reconnectCount = 0
  clearReconnectTimer()
  connect(userId)
}
