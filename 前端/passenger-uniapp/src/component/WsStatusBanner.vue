<template>
	<view
		v-if="visible"
		class="ws-wrap"
		:class="[
			float ? 'ws-wrap--float' : 'ws-wrap--block',
			alignCity ? 'ws-wrap--city' : ''
		]"
	>
		<view class="ws-card" :class="'ws-card--' + status" @click="onTap">
			<view class="ws-card__dot" />
			<view class="ws-card__text">
				<text class="ws-card__title">{{ title }}</text>
				<text class="ws-card__desc">{{ desc }}</text>
			</view>
			<text v-if="status === 'failed'" class="ws-card__link">重试</text>
		</view>
	</view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getWsStatus, onWs, retryPassengerWs } from '../utils/wsHub'

defineProps({
	float: { type: Boolean, default: false },
	/** 首页 custom 导航：与市区标识同高 */
	alignCity: { type: Boolean, default: false }
})

const statusInfo = ref(getWsStatus())
let off = null
let countdownTimer = null
let disposed = false
const remainSec = ref(0)

const status = computed(() => statusInfo.value.status || 'idle')
const visible = computed(() => ['connecting', 'reconnecting', 'failed'].includes(status.value))

const title = computed(() => {
	const s = status.value
	if (s === 'connecting') return '当前信号不好，正在连接'
	if (s === 'reconnecting') return '当前信号不好，正在重连'
	if (s === 'failed') return '实时连接已中断'
	return ''
})

const desc = computed(() => {
	const s = status.value
	const n = statusInfo.value.reconnectCount || 0
	const max = statusInfo.value.maxReconnect || 10
	if (s === 'connecting') return '消息可能稍有延迟'
	if (s === 'reconnecting') {
		const wait = remainSec.value > 0 ? ` · ${remainSec.value}s` : ''
		return `第 ${n}/${max} 次${wait}`
	}
	if (s === 'failed') return '将自动继续尝试，也可点重试'
	return ''
})

function clearCountdown() {
	if (countdownTimer) {
		clearInterval(countdownTimer)
		countdownTimer = null
	}
	remainSec.value = 0
}

function startCountdown(delayMs) {
	clearCountdown()
	if (!delayMs || delayMs <= 0) return
	remainSec.value = Math.ceil(delayMs / 1000)
	countdownTimer = setInterval(() => {
		remainSec.value = Math.max(0, remainSec.value - 1)
		if (remainSec.value <= 0) clearCountdown()
	}, 1000)
}

function applyStatus(info) {
	if (disposed) return
	statusInfo.value = info || getWsStatus()
	if (statusInfo.value.status === 'reconnecting') {
		startCountdown(statusInfo.value.nextRetryDelayMs || 0)
	} else {
		clearCountdown()
	}
}

function onTap() {
	// 仅失败时可点重试；连接/重连中由系统自动处理
	if (status.value === 'failed') {
		retryPassengerWs(true)
	}
}

onMounted(() => {
	disposed = false
	applyStatus(getWsStatus())
	off = onWs('status', applyStatus)
})

onUnmounted(() => {
	disposed = true
	if (off) off()
	off = null
	clearCountdown()
})
</script>

<style scoped>
.ws-wrap--float {
	position: fixed;
	left: 200rpx;
	right: 140rpx;
	top: calc(var(--window-top, var(--status-bar-height, 0px)) + 12px);
	z-index: 40;
	display: flex;
	justify-content: center;
	align-items: flex-start;
	pointer-events: none;
}

/* 首页无系统导航栏：与「济南市」chip 同高 */
.ws-wrap--float.ws-wrap--city {
	top: calc(var(--status-bar-height, 20px) + 12px);
}

.ws-wrap--block {
	display: flex;
	justify-content: center;
	margin: 0 0 20rpx;
}

.ws-card {
	pointer-events: auto;
	display: flex;
	align-items: center;
	gap: 12rpx;
	max-width: 100%;
	padding: 12rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(255, 255, 255, 0.96);
	box-shadow: 0 6rpx 20rpx rgba(15, 35, 52, 0.12);
	border: 1rpx solid rgba(232, 236, 240, 0.95);
}

.ws-card--connecting,
.ws-card--reconnecting {
	border-color: rgba(49, 142, 255, 0.22);
}

.ws-card--failed {
	border-color: rgba(245, 34, 45, 0.25);
}

.ws-card__dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	flex-shrink: 0;
	background: #318eff;
}

.ws-card--reconnecting .ws-card__dot {
	background: #fa8c16;
	animation: ws-blink 1.1s ease-in-out infinite;
}

.ws-card--connecting .ws-card__dot {
	animation: ws-blink 1.1s ease-in-out infinite;
}

.ws-card--failed .ws-card__dot {
	background: #f5222d;
}

.ws-card__text {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2rpx;
}

.ws-card__title {
	font-size: 24rpx;
	font-weight: 600;
	line-height: 1.25;
	color: #1f2f3d;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ws-card--failed .ws-card__title {
	color: #a8071a;
}

.ws-card__desc {
	font-size: 20rpx;
	line-height: 1.25;
	color: #8c8c8c;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ws-card__link {
	flex-shrink: 0;
	font-size: 24rpx;
	font-weight: 600;
	color: #318eff;
	padding-left: 8rpx;
}

@keyframes ws-blink {
	0%,
	100% {
		opacity: 1;
	}
	50% {
		opacity: 0.3;
	}
}
</style>
