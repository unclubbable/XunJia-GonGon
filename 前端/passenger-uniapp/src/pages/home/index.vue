<template>
	<view class="home-page">
		<view class="map-layer">
			<!-- 底部选点卡 + tabBar，留白需大于订单详情页 -->
			<BMap ref="mapRef" :initial-view-mode="'2D'" :bottom-padding="homeMapBottomPad" locate-mode="self" />
		</view>
		<view class="city-chip" @click="handleCity()">{{ city.name }}</view>
		<SelectPoint @confirm="handleConfrimPoint" />
	</view>
</template>
<script setup>
/**
 * 乘客端首页（全屏地图 + 底部选点卡片）
 */
import { computed, getCurrentInstance, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import { ApiGetCityList } from '../../api/city'
import { useStore } from 'vuex'
import BMap from '../../component/BMap.vue'
import SelectPoint from './component/SelectPoint.vue'

const mapRef = ref(null)
const $store = useStore()
const city = computed(() => $store.state.city)
const instance = getCurrentInstance()

/** 底部选点卡 + tabBar，供地图留白（上/下/左/右 avoid 的下边距） */
const homeMapBottomPad = ref(300)

provide('mapSearch', (str, cb) => mapRef.value && mapRef.value.search(cb, str))

let pointTimer = null
/** 避免 getLocation 写 city 与 updatalocaltion 重复触发 setLocation */
let mapCentered = false
let mapPadReady = false
let pendingLocation = null

function measureHomeMapBottomPad() {
	return new Promise((resolve) => {
		nextTick(() => {
			try {
				const sys = uni.getSystemInfoSync()
				const tabBottom = sys.windowBottom || sys.safeAreaInsets?.bottom || 0
				const fallback = Math.round(220 + tabBottom)
				let settled = false
				const finish = (val) => {
					if (settled) return
					settled = true
					homeMapBottomPad.value = Math.ceil(val)
					if (mapRef.value && mapRef.value.setBottomPadding) {
						mapRef.value.setBottomPadding(homeMapBottomPad.value)
					}
					resolve(homeMapBottomPad.value)
				}
				const query = uni.createSelectorQuery().in(instance)
				query.select('.select-box').boundingClientRect((rect) => {
					const cardH = (rect && rect.height) ? rect.height : 220
					finish(cardH + tabBottom)
				}).exec()
				setTimeout(() => finish(fallback), 400)
			} catch (_) {
				homeMapBottomPad.value = 300
				resolve(300)
			}
		})
	})
}

function applyMapLocation(location) {
	if (!mapRef.value) return
	if (!mapPadReady) {
		pendingLocation = location
		return
	}
	if (!mapCentered) {
		mapCentered = true
		mapRef.value.setLocation(location)
	} else {
		mapRef.value.updateLocationMarker(location)
	}
}

onMounted(async () => {
	await measureHomeMapBottomPad()
	mapPadReady = true
	if (pendingLocation) {
		applyMapLocation(pendingLocation)
		pendingLocation = null
	}

	// 仅切换城市时重定位；首次 GPS 定位由 updatalocaltion 统一居中
	watch(city, (n, o) => {
		if (o && n.adcode && o.adcode && n.adcode !== o.adcode && mapCentered) {
			setLocation()
		}
		setTimeout(() => mapRef.value && mapRef.value.clearDriving(), 500)
	})

	getLocation()
	updatalocaltion()
})

onUnmounted(() => {
	if (pointTimer) {
		clearTimeout(pointTimer)
		pointTimer = null
	}
})

function updatalocaltion() {
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success(res) {
			const { longitude, latitude, accuracy } = res
			const location = {
				center: [longitude, latitude],
				accuracy,
				locationRes: true
			}
			applyMapLocation(location)
			pointTimer = setTimeout(() => updatalocaltion(), 6000)
		},
		fail(err) {
			console.error('获取位置信息失败:', err)
			pointTimer = setTimeout(() => updatalocaltion(), 10000)
		}
	})
}

async function requestLocationPermission() {
	return new Promise((resolve) => {
		uni.getSetting({
			success: (res) => {
				if (res.authSetting['scope.userLocation']) {
					resolve(true)
				} else {
					uni.authorize({
						scope: 'scope.userLocation',
						success: () => resolve(true),
						fail: () => resolve(false)
					})
				}
			},
			fail: () => resolve(false)
		})
	})
}

const getLocation = async () => {
	requestLocationPermission()
	const { result } = await ApiGetCityList()
	uni.getLocation({
		type: 'gcj02',
		geocode: true,
		success(res) {
			const { address, longitude, latitude, accuracy } = res
			const matched = result && result.find(i => i.citycode === address.cityCode)
			$store.commit('setCity', {
				adcode: matched ? matched.adcode : city.value.adcode,
				cityCode: address.cityCode,
				name: address.city,
				center: `${longitude},${latitude}`,
				accuracy: `${accuracy}`,
				locationRes: true,
				poiName: address.poiName
			})
		},
		fail(err) {
			console.error('获取位置信息失败:', err)
			if (!mapCentered) {
				setLocation()
			}
		}
	})
}

function setLocation() {
	if (!mapRef.value) return
	const parts = String(city.value.center || '').split(',')
	const lng = parseFloat(parts[0])
	const lat = parseFloat(parts[1])
	if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
	applyMapLocation({
		center: [lng, lat],
		accuracy: Number(city.value.accuracy) || undefined,
		locationRes: city.value.locationRes
	})
}

const handleConfrimPoint = async (start, end) => {
	const [startLng, startLat] = start.location
	const [endLng, endLat] = end.location
	uni.navigateTo({
		url: `/pages/order/create/index?slng=${startLng}&slat=${startLat}&elng=${endLng}&elat=${endLat}&s=${start.name}&e=${end.name}`
	})
}

const handleCity = () => {
	uni.navigateTo({ url: '/pages/home/city/index' })
}
</script>
<style scoped lang="scss">
.home-page {
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

.city-chip {
	position: fixed;
	left: 24rpx;
	top: calc(var(--status-bar-height, 20px) + 12px);
	z-index: 30;
	background: rgba(255, 255, 255, 0.96);
	padding: 12rpx 22rpx 14rpx;
	border-radius: 999rpx;
	box-shadow: 0 6rpx 20rpx rgba(15, 35, 52, 0.12);
	font-size: $uni-font-size-sm;
	color: $uni-text-color;
	display: flex;
	align-items: center;
	border: 1px solid rgba(232, 236, 240, 0.95);

	&::after {
		content: '';
		display: block;
		border: 8rpx solid #666;
		border-right-color: transparent;
		border-left-color: transparent;
		border-bottom-color: transparent;
		margin-left: 10rpx;
		margin-top: 8rpx;
		border-radius: 4rpx;
	}
}
</style>
