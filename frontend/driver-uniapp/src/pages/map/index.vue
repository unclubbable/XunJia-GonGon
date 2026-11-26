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
import { ApiGetCityList, ApiRegeoCity, asText } from '../../api/city.js'
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

function matchCityByCode(list, cityCode) {
	const code = asText(cityCode)
	if (!list || !code) return null
	return list.find((i) => {
		const c = i.citycode
		if (Array.isArray(c)) return c.map(String).includes(code)
		return String(c) === code
	}) || null
}

/** 原生 geocode 无市名时，用 Web 逆地理补全 */
async function resolveCityByLngLat(longitude, latitude, nativeAddress, cityList) {
	const addr = nativeAddress || {}
	let name = asText(addr.city) || asText(addr.province)
	let cityCode = asText(addr.cityCode || addr.citycode)
	let adcode = ''
	let matched = matchCityByCode(cityList, cityCode)
	if (matched) {
		adcode = matched.adcode
		if (!name) name = asText(matched.name)
	}
	if (!name || !cityCode) {
		const { error, result: regeo } = await ApiRegeoCity(longitude, latitude)
		if (!error && regeo) {
			name = name || asText(regeo.name)
			cityCode = cityCode || asText(regeo.cityCode)
			adcode = adcode || asText(regeo.adcode)
			matched = matchCityByCode(cityList, cityCode) || matched
			if (matched) {
				adcode = matched.adcode || adcode
				name = name || asText(matched.name)
			}
		}
	}
	return {
		name: name || asText(city.value?.name) || '定位中',
		cityCode: cityCode || city.value?.cityCode || city.value?.citycode || '',
		adcode: adcode || (matched && matched.adcode) || city.value?.adcode
	}
}

async function getLocation() {
	const { result: cityList } = await ApiGetCityList()
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		async success(res) {
			const { address, longitude, latitude, accuracy } = res
			try {
				const resolved = await resolveCityByLngLat(longitude, latitude, address, cityList)
				$store.commit('setCity', {
					adcode: resolved.adcode,
					cityCode: resolved.cityCode,
					name: resolved.name,
					center: `${longitude},${latitude}`,
					accuracy: `${accuracy}`,
					locationRes: true
				})
				// 同步出车用的 point.adcode，避免地图页定位后回首页仍识别失败
				$store.commit('setPoint', {
					...($store.state.point || {}),
					lng: longitude,
					lat: latitude,
					name: resolved.name,
					code: resolved.cityCode,
					adcode: resolved.adcode,
					accuracy
				})
			} catch (e) {
				console.error('解析城市失败:', e)
				$store.commit('setCity', {
					...(city.value || {}),
					center: `${longitude},${latitude}`,
					accuracy: `${accuracy}`,
					locationRes: true,
					name: asText(city.value?.name) || '定位中'
				})
			}
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
