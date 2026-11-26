/**
 * 乘客端全局 WebSocket：单连接 + 按 type 分发。
 * App 端对 uni.connectSocket 极敏感：必须串行关→等→开，且 onError 也要排重连。
 */
const ORDER_TYPES = ['ORDER_DISPATCH', 'ORDER_STATUS', 'PAY_INFO', 'LOCATION_UPDATE']
const TICKET_TYPES = ['TICKET_MESSAGE', 'TICKET_STATUS']

const listeners = {
	order: new Set(),
	ticket: new Set(),
	unknown: new Set(),
	status: new Set()
}

/** @type {UniApp.SocketTask | null} */
let socketTask = null
let heartTimer = null
let reconnectTimer = null
let reopenTimer = null
let reconnectCount = 0
let manualClose = false
let connectGeneration = 0
let started = false
/** @type {'idle'|'connecting'|'connected'|'reconnecting'|'failed'} */
let connStatus = 'idle'
let nextRetryDelayMs = 0
let lastRetryAt = 0
let connectChain = Promise.resolve()
let connectBusy = false

/** @type {null | (() => { userId: any, token: string, wsBase: string })} */
let getContext = null

const HEART_INTERVAL_MS = 10000
const MAX_RECONNECT = 10
const BASE_RECONNECT_DELAY_MS = 3000
const MAX_RECONNECT_DELAY_MS = 30000
const SLOW_RETRY_MS = 15000
const REOPEN_DELAY_MS = 800
const RETRY_DEBOUNCE_MS = 2500

export function initPassengerWsHub(ctxGetter) {
	getContext = ctxGetter
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
			console.error('[乘客WS Hub] listener error', e)
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
		if (!socketTask) return
		try {
			socketTask.send({ data: JSON.stringify({ type: 'heartBeat' }) })
		} catch (e) {
			console.warn('[乘客WS Hub] 心跳失败', e)
		}
	}, HEART_INTERVAL_MS)
}

function clearReconnectTimer() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer)
		reconnectTimer = null
	}
}

function clearReopenTimer() {
	if (reopenTimer) {
		clearTimeout(reopenTimer)
		reopenTimer = null
	}
}

function sleep(ms) {
	return new Promise((resolve) => {
		reopenTimer = setTimeout(() => {
			reopenTimer = null
			resolve()
		}, ms)
	})
}

function teardownSocket(isManual = false) {
	manualClose = isManual
	clearReconnectTimer()
	clearReopenTimer()
	stopHeartBeat()
	connectGeneration += 1
	const prev = socketTask
	socketTask = null
	if (prev) {
		try {
			prev.close({})
		} catch (e) {
			// ignore
		}
	}
	return prev != null
}

function scheduleReconnect(userId) {
	if (manualClose || !userId || !started) return
	if (reconnectTimer) return

	let delay
	if (reconnectCount >= MAX_RECONNECT) {
		delay = SLOW_RETRY_MS
		setConnStatus('failed', { nextRetryDelayMs: delay })
		console.warn('[乘客WS Hub] 快速重连已用尽，转为慢速重试', delay)
	} else {
		delay = Math.min(
			BASE_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectCount),
			MAX_RECONNECT_DELAY_MS
		)
		reconnectCount += 1
		setConnStatus('reconnecting', { nextRetryDelayMs: delay })
	}
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null
		connect(userId)
	}, delay)
}

function dispatchMessage(raw) {
	let data
	try {
		data = JSON.parse(raw)
	} catch (e) {
		console.error('[乘客WS Hub] 解析失败', e)
		return
	}
	if (data.type === 'pong') return

	if (data.type && data.payload !== undefined) {
		if (ORDER_TYPES.includes(data.type)) {
			emit('order', { ...(data.payload || {}), type: data.type })
			return
		}
		if (TICKET_TYPES.includes(data.type)) {
			emit('ticket', { type: data.type, ...(data.payload || {}) })
			return
		}
		emit('unknown', data)
		return
	}
	emit('order', data)
}

function openSocket(userId, token, wsBase, generation) {
	if (generation !== connectGeneration || manualClose) return
	const url = `${wsBase}/connect/${userId}/1?token=${encodeURIComponent(token)}`
	console.log('[乘客WS Hub] 连接：', `${wsBase}/connect/${userId}/1?token=***`)

	let task
	let deadHandled = false
	const handleDead = (reason) => {
		if (deadHandled || generation !== connectGeneration) return
		deadHandled = true
		console.warn('[乘客WS Hub] 连接断开', reason || '')
		stopHeartBeat()
		if (socketTask === task) socketTask = null
		if (!manualClose && started) scheduleReconnect(userId)
		else if (manualClose) setConnStatus('idle')
	}

	try {
		task = uni.connectSocket({
			url,
			fail: (err) => handleDead(err),
			complete: () => {}
		})
	} catch (e) {
		console.error('[乘客WS Hub] connectSocket 异常', e)
		scheduleReconnect(userId)
		return
	}
	if (!task || typeof task.onOpen !== 'function') {
		console.error('[乘客WS Hub] 无法获取 SocketTask')
		scheduleReconnect(userId)
		return
	}
	socketTask = task

	task.onOpen(() => {
		if (generation !== connectGeneration || socketTask !== task) return
		console.log('[乘客WS Hub] 已连接')
		reconnectCount = 0
		setConnStatus('connected')
		startHeartBeat()
	})

	task.onMessage((res) => {
		if (generation !== connectGeneration || socketTask !== task) return
		dispatchMessage(res.data)
	})

	task.onClose(() => {
		if (generation !== connectGeneration) return
		console.log('[乘客WS Hub] 连接关闭')
		handleDead('close')
	})

	task.onError((err) => {
		if (generation !== connectGeneration) return
		handleDead(err)
	})
}

function connect(userId) {
	if (!getContext) return
	connectChain = connectChain
		.then(() => doConnect(userId))
		.catch((e) => {
			console.error('[乘客WS Hub] connect chain error', e)
		})
	return connectChain
}

async function doConnect(userId) {
	if (!getContext) return
	const { token, wsBase } = getContext()
	if (!userId || !wsBase) {
		console.warn('[乘客WS Hub] 缺少 userId 或 ws 地址')
		setConnStatus('idle')
		return
	}
	if (!token) {
		console.warn('[乘客WS Hub] 缺少 token')
		setConnStatus('idle')
		return
	}

	connectBusy = true
	const hadPrev = teardownSocket(false)
	manualClose = false
	setConnStatus(reconnectCount > 0 ? 'reconnecting' : 'connecting')
	const generation = connectGeneration

	await sleep(hadPrev ? REOPEN_DELAY_MS : 320)
	if (generation !== connectGeneration || manualClose) {
		connectBusy = false
		return
	}

	openSocket(userId, token, wsBase, generation)
	connectBusy = false
}

function hasPendingWork() {
	return !!(reconnectTimer || reopenTimer || connectBusy)
}

export function startPassengerWs() {
	if (!getContext) return
	const { userId } = getContext()
	started = true
	if (!userId) {
		teardownSocket(true)
		setConnStatus('idle')
		return
	}
	if (connStatus === 'connected' && socketTask) return
	if (hasPendingWork()) return
	if (connStatus === 'connecting' && socketTask) return
	reconnectCount = 0
	connect(userId)
}

export function stopPassengerWs() {
	started = false
	teardownSocket(true)
	setConnStatus('idle')
}

export function retryPassengerWs(force = false) {
	if (!getContext) return
	const { userId, token } = getContext()
	if (!userId || !token) {
		setConnStatus('idle')
		return
	}
	const now = Date.now()
	if (!force && now - lastRetryAt < RETRY_DEBOUNCE_MS) return
	lastRetryAt = now
	started = true
	reconnectCount = 0
	clearReconnectTimer()
	connect(userId)
}
