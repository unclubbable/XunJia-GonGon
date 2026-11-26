<template>
	<view
		v-if="visible"
		class="ws-wrap"
		:class="[float ? 'ws-wrap--float' : 'ws-wrap--block', edge ? 'ws-wrap--edge' : '']"
		@click="onTap"
	>
		<view class="ws-card" :class="'ws-card--' + status">
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
import { getWsStatus, onWs, retryDriverWs } from '../utils/wsHub'

defineProps({
	float: { type: Boolean, default: false },
	/** 抵消页面左右 padding，实现顶格 */
	edge: { type: Boolean, default: false }
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
	if (s === 'connecting') return '听单与消息可能延迟'
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
	if (status.value === 'failed') {
		retryDriverWs(true)
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
	left: 0;
	right: 0;
	top: var(--window-top, var(--status-bar-height, 0px));
	z-index: 40;
}

.ws-wrap--block {
	width: 100%;
	margin: 0 0 20rpx;
}

/* 首页等有左右 padding 时顶格 */
.ws-wrap--edge {
	margin: -30rpx -32rpx 24rpx;
	width: calc(100% + 64rpx);
}

.ws-card {
	display: flex;
	align-items: center;
	gap: 14rpx;
	width: 100%;
	box-sizing: border-box;
	padding: 20rpx 28rpx;
	background: #ffffff;
	border-bottom: 1rpx solid #eef1f5;
}

.ws-card--connecting {
	background: #f0f7ff;
	border-bottom-color: rgba(49, 142, 255, 0.18);
}

.ws-card--reconnecting {
	background: #fff8ef;
	border-bottom-color: rgba(250, 140, 22, 0.2);
}

.ws-card--failed {
	background: #fff1f0;
	border-bottom-color: rgba(245, 34, 45, 0.18);
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
	gap: 4rpx;
}

.ws-card__title {
	font-size: 28rpx;
	font-weight: 600;
	line-height: 1.3;
	color: #1f2f3d;
}

.ws-card--failed .ws-card__title {
	color: #a8071a;
}

.ws-card__desc {
	font-size: 22rpx;
	line-height: 1.3;
	color: #8c8c8c;
}

.ws-card__link {
	flex-shrink: 0;
	font-size: 26rpx;
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
