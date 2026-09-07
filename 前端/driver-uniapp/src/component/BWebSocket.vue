<template>
	<!-- 纯 WS，无 UI -->
	<view style="display: none;"></view>
</template>

<script setup>
/**
 * 司机 WS：/connect/{id}/2，10s 心跳，断了自动重连
 */
import { computed, watch, onUnmounted, ref } from 'vue';
import { useStore } from 'vuex';

const $store = useStore();
const userInfo = computed(() => $store.state.userInfo);
const $emits = defineEmits(['receiveOrder']);

const isConnected = ref(false);

/** @type {UniApp.SocketTask | null} */
let socketTask = null;
let heartTimer = null;
let reconnectTimer = null;
let reconnectCount = 0;
/** 手动关不重连 */
let manualClose = false;
/** 世代号，防旧 socket 误触发 */
let connectGeneration = 0;

const HEART_INTERVAL_MS = 10000;
const MAX_RECONNECT = 10;
const BASE_RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

/** 取 ws 地址，兼容老 sse 字段 */
function getWsBase() {
	const conf = $store.state.serverConf || {};
	return conf.ws || conf.sse || '';
}

function stopHeartBeat() {
	if (heartTimer) {
		clearInterval(heartTimer);
		heartTimer = null;
	}
}

function startHeartBeat() {
	stopHeartBeat();
	heartTimer = setInterval(() => {
		if (!isConnected.value || !socketTask) return;
		try {
			socketTask.send({
				data: JSON.stringify({ type: 'heartBeat' })
			});
		} catch (e) {
			console.warn('[司机WS] 心跳发送失败', e);
		}
	}, HEART_INTERVAL_MS);
}

function clearReconnectTimer() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
}

/** 关连接，manual 不重连 */
function closeSocket(isManual = false) {
	manualClose = isManual;
	clearReconnectTimer();
	stopHeartBeat();
	isConnected.value = false;
	connectGeneration += 1;
	const prev = socketTask;
	socketTask = null;
	if (prev) {
		try {
			prev.close({});
		} catch (e) {
			// ignore
		}
	}
}

function scheduleReconnect(driverId) {
	if (manualClose || !driverId) return;
	if (reconnectCount >= MAX_RECONNECT) {
		console.warn('[司机WS] 已达最大重连次数，停止重连');
		return;
	}
	const delay = Math.min(
		BASE_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectCount),
		MAX_RECONNECT_DELAY_MS
	);
	reconnectCount += 1;
	console.log(`[司机WS] ${delay}ms 后第 ${reconnectCount} 次重连`);
	clearReconnectTimer();
	reconnectTimer = setTimeout(() => {
		connect(driverId);
	}, delay);
}

/** 建连 */
function connect(driverId) {
	const base = getWsBase();
	if (!driverId || !base) {
		console.warn('[司机WS] 缺少 driverId 或 ws 地址，跳过连接');
		return;
	}

	closeSocket(false);
	manualClose = false;
	const generation = connectGeneration;

	const url = `${base}/connect/${driverId}/2`;
	console.log('[司机WS] 连接：', url);

	socketTask = uni.connectSocket({
		url,
		complete: () => {}
	});

	if (!socketTask || typeof socketTask.onOpen !== 'function') {
		console.error('[司机WS] 无法获取 SocketTask，请检查运行环境');
		scheduleReconnect(driverId);
		return;
	}

	const task = socketTask;

	task.onOpen(() => {
		if (generation !== connectGeneration || socketTask !== task) return;
		console.log('[司机WS] 已连接');
		isConnected.value = true;
		reconnectCount = 0;
		startHeartBeat();
	});

	task.onMessage((res) => {
		if (generation !== connectGeneration || socketTask !== task) return;
		try {
			const data = JSON.parse(res.data);
			if (data.type === 'pong') {
				return;
			}
			console.log('[司机WS] 收到订单消息：', data);
			$emits('receiveOrder', data);
		} catch (e) {
			console.error('[司机WS] 消息解析失败', e);
		}
	});

	task.onClose(() => {
		if (generation !== connectGeneration) return;
		console.log('[司机WS] 连接关闭');
		isConnected.value = false;
		stopHeartBeat();
		if (socketTask === task) {
			socketTask = null;
		}
		if (!manualClose) {
			scheduleReconnect(driverId);
		}
	});

	task.onError((err) => {
		if (generation !== connectGeneration) return;
		console.warn('[司机WS] 连接错误', err);
	});
}

// driverId 就绪或变化时连接
watch(
	() => userInfo.value?.driverId,
	(driverId) => {
		if (!driverId) {
			closeSocket(true);
			return;
		}
		reconnectCount = 0;
		connect(driverId);
	},
	{ immediate: true }
);

onUnmounted(() => {
	closeSocket(true);
});
</script>
