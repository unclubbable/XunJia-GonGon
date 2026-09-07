<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">新建工单</text>
			<text class="page-subtitle">选择类型并填写问题描述</text>
		</view>

		<view class="card">
			<view class="label">反馈类型</view>
			<picker :range="categoryLabels" @change="onCategoryChange">
				<view class="picker">{{ currentCategoryLabel }}</view>
			</picker>

			<!-- 改城市：计价表字典 -->
			<template v-if="currentCategory?.value === 'CHANGE_CITY'">
				<view class="label">目标运营城市</view>
				<picker
					v-if="switchableCities.length"
					:range="switchableCities"
					range-key="label"
					@change="onCityChange"
				>
					<view class="picker">{{ selectedCityLabel || '请选择可切换城市' }}</view>
				</picker>
				<view v-else-if="onlyCurrentCity" class="hint warn">
					您的绑定车型仅在 {{ allOperableCities[0]?.cityName || allOperableCities[0]?.cityCode }} 配置了计价规则，您已在该城市运营，暂无可切换目标。
				</view>
				<view v-else class="hint warn">暂无可切换城市，请确认已绑定车辆且存在对应车型的计价规则</view>
				<view v-if="allOperableCities.length" class="hint">
					可运营城市（计价表）：{{ allOperableCities.map(i => i.cityName || i.cityCode).join('、') }}
				</view>
			</template>

			<!-- 改资料：可勾选变更项 -->
			<template v-if="currentCategory?.value === 'CHANGE_PROFILE'">
				<view class="label">选择要变更的项目</view>
				<checkbox-group @change="onProfileFieldsChange">
					<label
						v-for="item in PROFILE_FIELD_OPTIONS"
						:key="item.key"
						class="check-row"
					>
						<checkbox :value="item.key" :checked="profileSelected.includes(item.key)" color="#318eff" />
						<text>{{ item.label }}</text>
					</label>
				</checkbox-group>
				<template v-for="item in activeProfileFields" :key="item.key">
					<view class="label">{{ item.label }}</view>
					<picker
						v-if="item.type === 'gender'"
						:range="genderOptions"
						range-key="label"
						@change="(e) => onGenderChange(e)"
					>
						<view class="picker">{{ profileValues.driverGenderLabel || '请选择性别' }}</view>
					</picker>
					<picker
						v-else-if="item.type === 'date'"
						mode="date"
						:value="profileValues[item.key] || '2000-01-01'"
						@change="(e) => onBirthdayChange(e)"
					>
						<view class="picker">{{ profileValues[item.key] || item.placeholder }}</view>
					</picker>
					<input
						v-else
						class="input"
						v-model="profileValues[item.key]"
						:placeholder="item.placeholder"
					/>
				</template>
			</template>

			<!-- 绑定/换绑车辆 -->
			<template v-if="currentCategory?.value === 'BIND_VEHICLE'">
				<view class="label">选择目标车辆</view>
				<picker
					v-if="bindableCars.length"
					:range="bindableCars"
					range-key="label"
					@change="onCarChange"
				>
					<view class="picker">{{ selectedCarLabel || '请选择未绑定车辆' }}</view>
				</picker>
				<view v-else class="hint warn">当前运营区域暂无可绑定车辆（需有计价规则且未被绑定）</view>
			</template>

			<!-- 关联订单 -->
			<template v-if="needOrder">
				<view class="label">关联订单</view>
				<view class="order-row">
					<input
						class="input flex1"
						type="number"
						v-model="form.orderId"
						placeholder="订单ID"
					/>
					<button class="pick-btn" size="mini" @click="openOrderPicker">选择我的订单</button>
				</view>
				<view v-if="selectedOrderBrief" class="hint">{{ selectedOrderBrief }}</view>
			</template>

			<view class="label">问题描述</view>
			<textarea
				class="textarea"
				v-model="form.content"
				maxlength="500"
				placeholder="请详细描述"
			/>
		</view>
		<button class="submit" :loading="submitting" @click="handleSubmit">提交工单</button>

		<!-- 订单选择弹层 -->
		<view v-if="orderPickerVisible" class="mask" @click="orderPickerVisible = false">
			<view class="popup" @click.stop>
				<view class="popup-title">选择我的订单</view>
				<scroll-view scroll-y class="popup-list">
					<view
						v-for="item in orderList"
						:key="item.id"
						class="order-item"
						@click="selectOrder(item)"
					>
						<view class="order-id">#{{ item.id }} · {{ orderStatusText(item.orderStatus) }}</view>
						<view class="order-route">{{ item.departure }} → {{ item.destination }}</view>
						<view class="order-time">{{ item.orderTime || item.departTime || '' }}</view>
					</view>
					<view v-if="!orderList.length && !orderLoading" class="empty-tip">暂无订单</view>
				</scroll-view>
				<button class="popup-close" @click="orderPickerVisible = false">关闭</button>
			</view>
		</view>
	</view>
</template>


<script setup>
	import { computed, reactive, ref, watch } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import {
		ApiTicketCreate,
		ApiTicketOperableCities,
		ApiTicketBindableCars
	} from '../../../api/ticket'
	import { ApiGetAllOrderInfo } from '../../../api/order'
	import {
		DRIVER_CATEGORIES,
		PROFILE_FIELD_OPTIONS,
		orderStatusText
	} from '../../../utils/ticketDict'
	import { ShowToast } from '../../../utils'

	const categoryIndex = ref(0)
	const submitting = ref(false)
	const allOperableCities = ref([])
	const cityIndex = ref(-1)
	const bindableCars = ref([])
	const carIndex = ref(-1)
	const profileSelected = ref([])
	const profileValues = reactive({
		driverSurname: '',
		driverName: '',
		driverGender: '',
		driverGenderLabel: '',
		driverNation: '',
		driverBirthday: '',
		driverContactAddress: ''
	})
	const genderOptions = [
		{ value: 1, label: '男' },
		{ value: 2, label: '女' }
	]
	const form = reactive({
		orderId: '',
		content: ''
	})
	const orderPickerVisible = ref(false)
	const orderList = ref([])
	const orderLoading = ref(false)
	const selectedOrderBrief = ref('')

	const categoryLabels = DRIVER_CATEGORIES.map((i) => i.label)
	const currentCategory = computed(() => DRIVER_CATEGORIES[categoryIndex.value])
	const currentCategoryLabel = computed(() => currentCategory.value?.label || '请选择')
	const needOrder = computed(() => !!currentCategory.value?.needOrder)
	const selectedCity = computed(() =>
		cityIndex.value >= 0 ? switchableCities.value[cityIndex.value] : null
	)
	const switchableCities = computed(() =>
		allOperableCities.value.filter((i) => i.switchable === true)
	)
	const onlyCurrentCity = computed(() =>
		allOperableCities.value.length > 0 && switchableCities.value.length === 0
	)
	const selectedCityLabel = computed(() => selectedCity.value?.label || '')
	const selectedCar = computed(() =>
		carIndex.value >= 0 ? bindableCars.value[carIndex.value] : null
	)
	const selectedCarLabel = computed(() => selectedCar.value?.label || '')
	const activeProfileFields = computed(() =>
		PROFILE_FIELD_OPTIONS.filter((i) => profileSelected.value.includes(i.key))
	)

	onLoad((query) => {
		if (query?.orderId) form.orderId = String(query.orderId)
		if (query?.category) {
			const idx = DRIVER_CATEGORIES.findIndex((i) => i.value === query.category)
			if (idx >= 0) categoryIndex.value = idx
		}
	})

	const loadOperableCities = async () => {
		const { error, result } = await ApiTicketOperableCities()
		if (error) return
		const cities = result?.cities ?? (Array.isArray(result) ? result : [])
		allOperableCities.value = cities.map((i) => ({
			cityCode: i.cityCode,
			cityName: i.cityName,
			current: !!i.current,
			switchable: i.switchable === true,
			label: `${i.cityName || i.cityCode}（${i.cityCode}）${i.current ? ' · 当前' : ''}`
		}))
		cityIndex.value = -1
	}

	const loadBindableCars = async () => {
		const { error, result } = await ApiTicketBindableCars()
		if (error) return
		bindableCars.value = (result || []).map((i) => ({
			...i,
			label: `${i.vehicleNo} · ${i.vehicleTypeName || i.vehicleType}${i.brand ? ' · ' + i.brand : ''}`
		}))
	}

	watch(currentCategory, (cat) => {
		cityIndex.value = -1
		carIndex.value = -1
		if (cat?.value === 'CHANGE_CITY') loadOperableCities()
		if (cat?.value === 'BIND_VEHICLE') loadBindableCars()
	}, { immediate: true })

	const onCategoryChange = (e) => {
		categoryIndex.value = Number(e.detail.value || 0)
	}

	const onCityChange = (e) => {
		cityIndex.value = Number(e.detail.value || 0)
	}

	const onCarChange = (e) => {
		carIndex.value = Number(e.detail.value || 0)
	}

	const onProfileFieldsChange = (e) => {
		profileSelected.value = e.detail.value || []
	}

	const onGenderChange = (e) => {
		const idx = Number(e.detail.value || 0)
		const opt = genderOptions[idx]
		if (opt) {
			profileValues.driverGender = opt.value
			profileValues.driverGenderLabel = opt.label
		}
	}

	const onBirthdayChange = (e) => {
		profileValues.driverBirthday = e.detail.value || ''
	}

	const openOrderPicker = async () => {
		orderPickerVisible.value = true
		if (orderList.value.length) return
		orderLoading.value = true
		try {
			const { error, result } = await ApiGetAllOrderInfo()
			if (error) return
			orderList.value = result || []
		} finally {
			orderLoading.value = false
		}
	}

	const selectOrder = (item) => {
		form.orderId = String(item.id)
		selectedOrderBrief.value = `#${item.id} ${item.departure} → ${item.destination}`
		orderPickerVisible.value = false
	}

	const buildPayload = (category) => {
		if (category.value === 'CHANGE_CITY') {
			if (!selectedCity.value) {
				if (onlyCurrentCity.value) {
					ShowToast('您已在唯一可运营城市，无需切换')
				} else {
					ShowToast('请选择目标运营城市')
				}
				return null
			}
			return JSON.stringify({ targetAddress: selectedCity.value.cityCode })
		}
		if (category.value === 'CHANGE_PROFILE') {
			if (!profileSelected.value.length) {
				ShowToast('请至少勾选一项要变更的信息')
				return null
			}
			const body = {}
			for (const key of profileSelected.value) {
				if (key === 'driverGender') {
					if (!profileValues.driverGender) {
						ShowToast('请填写性别')
						return null
					}
					body.driverGender = profileValues.driverGender
				} else {
					const val = String(profileValues[key] || '').trim()
					if (!val) {
						const field = PROFILE_FIELD_OPTIONS.find((i) => i.key === key)
						ShowToast(`请填写${field?.label || key}`)
						return null
					}
					body[key] = val
				}
			}
			return JSON.stringify(body)
		}
		if (category.value === 'BIND_VEHICLE') {
			if (!selectedCar.value) {
				ShowToast('请选择目标车辆')
				return null
			}
			return JSON.stringify({
				targetCarId: selectedCar.value.id,
				vehicleNo: selectedCar.value.vehicleNo,
				vehicleType: selectedCar.value.vehicleType
			})
		}
		return undefined
	}

	const handleSubmit = async () => {
		const category = currentCategory.value
		const content = form.content.trim()
		if (!content) {
			ShowToast('请填写问题描述')
			return
		}
		if (category.needOrder && !form.orderId) {
			ShowToast('该类型必须关联订单')
			return
		}
		const requestPayload = buildPayload(category)
		if (category.needPayload && requestPayload == null) return

		submitting.value = true
		try {
			const { error, result } = await ApiTicketCreate({
				category: category.value,
				content,
				...(form.orderId ? { orderId: Number(form.orderId) } : {}),
				...(requestPayload ? { requestPayload } : {})
			})
			if (error) return
			ShowToast('提交成功')
			setTimeout(() => {
				uni.redirectTo({ url: `/pages/ticket/detail/index?ticketId=${result.id}` })
			}, 400)
		} finally {
			submitting.value = false
		}
	}
</script>

<style lang="scss" scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		padding: 24rpx 32rpx 60rpx;
		box-sizing: border-box;
	}

	.page-header {
		margin-bottom: 28rpx;
		text-align: center;

		.page-title {
			font-size: 44rpx;
			font-weight: 700;
			color: #1f2f3d;
			display: block;
			margin-bottom: 12rpx;
		}

		.page-subtitle {
			font-size: 24rpx;
			color: #318eff;
			background: #e8f3ff;
			padding: 8rpx 24rpx;
			border-radius: 999rpx;
			display: inline-block;
		}
	}

	.card {
		background: #fff;
		border-radius: 28rpx;
		padding: 32rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);
	}

	.label {
		font-size: 26rpx;
		font-weight: 500;
		color: #86909c;
		margin: 24rpx 0 12rpx;

		&:first-child {
			margin-top: 0;
		}
	}

	.hint {
		font-size: 24rpx;
		color: #86909c;
		margin-top: 12rpx;
		line-height: 1.5;

		&.warn {
			color: #fa8c16;
			background: #fff7e6;
			padding: 16rpx 20rpx;
			border-radius: 12rpx;
		}
	}

	.check-row {
		display: flex;
		align-items: center;
		gap: 12rpx;
		padding: 16rpx 20rpx;
		margin-bottom: 12rpx;
		font-size: 28rpx;
		color: #1f2f3d;
		background: #f8f9fc;
		border-radius: 16rpx;
	}

	.picker,
	.input {
		background: #f8f9fc;
		border-radius: 16rpx;
		padding: 24rpx 22rpx;
		font-size: 28rpx;
		color: #1f2f3d;
		border: 1px solid #eef0f4;
		box-sizing: border-box;
	}

	.order-row {
		display: flex;
		align-items: center;
		gap: 16rpx;

		.flex1 {
			flex: 1;
		}
	}

	.pick-btn {
		background: #e8f3ff;
		color: #318eff;
		border: none;
		white-space: nowrap;
		border-radius: 12rpx;
		font-weight: 500;

		&::after {
			border: none;
		}
	}

	.textarea {
		width: 100%;
		min-height: 220rpx;
		background: #f8f9fc;
		border-radius: 16rpx;
		padding: 22rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		border: 1px solid #eef0f4;
	}

	.submit {
		background: linear-gradient(135deg, #318eff, #1a6fe8);
		color: #fff;
		border-radius: 999rpx;
		font-size: 32rpx;
		font-weight: 600;
		height: 96rpx;
		line-height: 96rpx;
		box-shadow: 0 12rpx 28rpx rgba(49, 142, 255, 0.28);

		&::after {
			border: none;
		}

		&:active {
			opacity: 0.92;
			transform: scale(0.98);
		}
	}

	.mask {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		z-index: 100;
		display: flex;
		align-items: flex-end;
	}

	.popup {
		width: 100%;
		max-height: 70vh;
		background: #fff;
		border-radius: 28rpx 28rpx 0 0;
		padding: 32rpx;
		box-sizing: border-box;
	}

	.popup-title {
		font-size: 32rpx;
		font-weight: 600;
		margin-bottom: 20rpx;
		text-align: center;
		color: #1f2f3d;
	}

	.popup-list {
		max-height: 50vh;
	}

	.order-item {
		padding: 24rpx;
		margin-bottom: 12rpx;
		background: #f8f9fc;
		border-radius: 16rpx;
		border: none;

		&:active {
			background: #e8f3ff;
		}
	}

	.order-id {
		font-size: 28rpx;
		color: #318eff;
		font-weight: 600;
	}

	.order-route {
		font-size: 26rpx;
		color: #1f2f3d;
		margin-top: 8rpx;
	}

	.order-time {
		font-size: 22rpx;
		color: #86909c;
		margin-top: 6rpx;
	}

	.empty-tip {
		text-align: center;
		color: #c0c4cc;
		padding: 40rpx 0;
	}

	.popup-close {
		margin-top: 20rpx;
		background: #f5f7fa;
		color: #595959;
		border-radius: 999rpx;
		font-weight: 500;

		&::after {
			border: none;
		}
	}
</style>
