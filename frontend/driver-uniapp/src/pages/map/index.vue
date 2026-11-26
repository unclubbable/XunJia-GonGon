<template>
	<view class="map-page">
		<view class="map-layer">
			<BMap ref="mapRef" :initial-view-mode="'2D'" :bottom-padding="40" locate-mode="self" />
			<BWebSocket @receiveOrder="handleReceiveOrder" />
		</view>
		<view class="status-chip">
			<text class="brand">讯家地图</text>
			<text class="hint">听单天下</text>
		</view>
	</view>
</template>

<script setup>
import BWebSocket from '../../component/BWebSocket.vue'
import BMap from '../../component/BMap.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ApiGetCityList } from '../../api/city.js'
import { useStore } from 'vuex'

const mapRef = ref(null)
const $store = useStore()
const point = computed(() => $store.state.point)
const city = computed(() => $store.state.city)
let orderId = null
let pointTimer = null

onMounted(() => {
	getLocation()
	updatalocaltion()
	setTimeout(() => {
		if (mapRef.value && mapRef.value.setFollow) {
			mapRef.value.setFollow(true)
		}
	}, 800)
})

onUnmounted(() => {
	if (pointTimer) {
		clearTimeout(pointTimer)
		pointTimer = null
	}
})

function updatalocaltion() {
	if (point.value && point.value.lng != null && point.value.lat != null) {
		const location = {
			center: [point.value.lng, point.value.lat],
			accuracy: point.value.accuracy
		}
		if (mapRef.value) {
			mapRef.value.updateLocationMarker(location)
		}
	}
	pointTimer = setTimeout(() => {
		updatalocaltion()
	}, 6000)
}

function handleReceiveOrder(arg) {
	orderId = arg.orderId
	uni.redirectTo({ url: `/pages/order/detail/index?orderId=${orderId}` })
}

async function getLocation() {
	const { result } = await ApiGetCityList()
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success(res) {
			const { address, longitude, latitude, accuracy } = res
			const matched = result && result.find(i => {
				const code = i.citycode
				if (Array.isArray(code)) return code.includes(address.cityCode)
				return String(code) === String(address.cityCode)
			})
			$store.commit('setCity', {
				adcode: matched ? matched.adcode : city.value.adcode,
				cityCode: address.cityCode,
				name: address.city,
				center: `${longitude},${latitude}`,
				accuracy: `${accuracy}`,
				locationRes: true
			})
			setLocation()
		},
		fail(err) {
			console.error('获取位置信息失败:', err)
			setLocation()
		}
	})
}

function setLocation() {
	if (!mapRef.value) return
	const centerStr = String(city.value.center || '')
	const location = {
		center: centerStr.split(','),
		accuracy: city.value.accuracy,
		locationRes: city.value.locationRes
	}
	mapRef.value.setLocation(location)
	setTimeout(() => mapRef.value && mapRef.value.clearDriving(), 500)
}

watch(city, () => setLocation())
</script>

<style lang="scss" scoped>
.map-page {
	position: relative;
	width: 100%;
	height: 100vh;
	overflow: hidden;
	background: #e8eef5;
}

.map-layer {
	position: absolute;
	inset: 0;
	z-index: 1;
}

.status-chip {
	position: fixed;
	left: 24rpx;
	/* 与地图工具条对齐：避开系统状态栏 */
	top: calc(var(--status-bar-height, 20px) + 12px);
	z-index: 30;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
	padding: 14rpx 22rpx;
	background: rgba(255, 255, 255, 0.96);
	border-radius: 20rpx;
	box-shadow: 0 6rpx 20rpx rgba(15, 35, 52, 0.12);
	border: 1px solid rgba(232, 236, 240, 0.95);
}

.brand {
	font-size: 28rpx;
	font-weight: 700;
	color: $uni-color-primary;
}

.hint {
	font-size: 20rpx;
	color: #8c8c8c;
}
</style>
