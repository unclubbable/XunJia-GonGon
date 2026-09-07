<template>
	<view class="select-box">
		<view class="sheet-handle" />
		<view class="brand-row">
			<text class="brand-title">讯家出行</text>
			<text class="brand-sub">去哪儿都行</text>
		</view>
		<view class="start" @click="startPointVisible = true">
			<text v-if="!startPoint.id">您在哪上车？</text>
			<template v-else>
				<text>您将从</text>
				<view class="start-point-text">{{ startPoint.name }}</view>
				<text>上车</text>
			</template>
		</view>
		<view class="end" @click="endPointVisible = true">
			<text v-if="!endPoint.id">您要去哪儿？</text>
			<text v-else class="end-point-text">{{ endPoint.name }}</text>
		</view>
	</view>
	<PointList v-model:visible="startPointVisible" @change="handleChangeStart" />
	<PointList v-model:visible="endPointVisible" @change="handleChangeEnd" />
</template>
<script setup>
import { ref, watch, computed, inject } from 'vue'
import { useStore } from 'vuex'
import PointList from './PointList.vue'

const $emits = defineEmits(['confirm'])
const $store = useStore()
const startPointVisible = ref(false)
const startPoint = ref({})
const endPointVisible = ref(false)
const endPoint = ref({})
const city = computed(() => $store.state.city)
const mapSearch = inject('mapSearch')

watch(city, () => {
	startPoint.value = {}
	endPoint.value = {}
	if (city.value.poiName) {
		setTimeout(() => {
			if (!mapSearch) return
			mapSearch(city.value.poiName, (result) => {
				if (result && result.pois && result.pois.length > 0) {
					startPoint.value = result.pois[0]
				}
			})
		}, 500)
	}
})

const handleChangeStart = (item) => {
	startPoint.value = item
	endPoint.value = {}
}

const handleChangeEnd = (item) => {
	endPoint.value = item
	if (startPoint.value.id) {
		$emits('confirm', startPoint.value, endPoint.value)
	}
}
</script>
<style scoped lang="scss">
.select-box {
	width: 100%;
	box-sizing: border-box;
	position: fixed;
	bottom: var(--window-bottom);
	left: 0;
	background: rgba(255, 255, 255, 0.98);
	border-radius: 28rpx 28rpx 0 0;
	z-index: 9;
	padding: 12rpx $uni-spacing-row-max 40rpx;
	box-shadow: 0 -8rpx 32rpx rgba(15, 35, 52, 0.1);
	border-top: 1px solid rgba(232, 236, 240, 0.9);
}

.sheet-handle {
	width: 72rpx;
	height: 8rpx;
	border-radius: 999rpx;
	background: #d9dee5;
	margin: 4rpx auto 16rpx;
}

.brand-row {
	display: flex;
	align-items: baseline;
	gap: 12rpx;
	margin-bottom: 20rpx;
	padding: 0 8rpx;
}

.brand-title {
	font-size: 34rpx;
	font-weight: 700;
	color: $uni-color-primary;
	letter-spacing: 1rpx;
}

.brand-sub {
	font-size: 22rpx;
	color: #8c8c8c;
}

.start {
	height: 80rpx;
	font-size: $uni-font-size-base;
	display: flex;
	align-items: center;
	padding: 0 $uni-spacing-lg;
	margin-bottom: $uni-spacing-max;
	&::before {
		display: block;
		content: '';
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: $uni-color-primary;
		margin-right: $uni-spacing-row-base;
		box-shadow: 0 0 0 6rpx rgba(49, 142, 255, 0.18);
	}
}

.start-point-text {
	color: $uni-color-primary;
	font-weight: bold;
	margin: 0 $uni-spacing-sm;
	max-width: 400rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.end {
	background: #f3f6fa;
	border-radius: 16rpx;
	height: 96rpx;
	line-height: 96rpx;
	padding: 0 $uni-spacing-lg;
	display: flex;
	align-items: center;
	font-size: $uni-font-size-lg;
	color: #1f2f3d;
	&::before {
		display: block;
		content: '';
		width: 14rpx;
		height: 14rpx;
		border-radius: 50%;
		background: $uni-color-warning;
		margin-right: $uni-spacing-row-base;
	}
}

.end-point-text {
	font-weight: 600;
	max-width: 520rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
