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
				placeholder="请详细描述问题，便于平台处理"
			/>
			<view class="count">{{ form.content.length }}/500</view>
		</view>

		<button class="submit" :loading="submitting" @click="handleSubmit">提交工单</button>

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
	import { computed, reactive, ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { ApiTicketCreate } from '../../../api/ticket'
	import { ApiGetAllOrderInfo } from '../../../api/order'
	import { PASSENGER_CATEGORIES, orderStatusText } from '../../../utils/ticketDict'
	import { ShowToast } from '../../../utils'

	const categoryIndex = ref(0)
	const submitting = ref(false)
	const form = reactive({
		orderId: '',
		content: ''
	})
	const orderPickerVisible = ref(false)
	const orderList = ref([])
	const orderLoading = ref(false)
	const selectedOrderBrief = ref('')

	const categoryLabels = PASSENGER_CATEGORIES.map((i) => i.label)
	const currentCategory = computed(() => PASSENGER_CATEGORIES[categoryIndex.value])
	const currentCategoryLabel = computed(() => currentCategory.value?.label || '请选择')
	const needOrder = computed(() => !!currentCategory.value?.needOrder)

	onLoad((query) => {
		if (query?.orderId) {
			form.orderId = String(query.orderId)
		}
		if (query?.category) {
			const idx = PASSENGER_CATEGORIES.findIndex((i) => i.value === query.category)
			if (idx >= 0) categoryIndex.value = idx
		}
	})

	const onCategoryChange = (e) => {
		categoryIndex.value = Number(e.detail.value || 0)
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

	const handleSubmit = async () => {
		const category = currentCategory.value
		if (!category) {
			ShowToast('请选择类型')
			return
		}
		const content = form.content.trim()
		if (!content) {
			ShowToast('请填写问题描述')
			return
		}
		if (category.needOrder && !form.orderId) {
			ShowToast('该类型必须关联订单')
			return
		}
		submitting.value = true
		try {
			const payload = {
				category: category.value,
				content,
				...(form.orderId ? { orderId: Number(form.orderId) } : {})
			}
			const { error, result } = await ApiTicketCreate(payload)
			if (error) return
			ShowToast('提交成功')
			setTimeout(() => {
				uni.redirectTo({
					url: `/pages/ticket/detail/index?ticketId=${result.id}`
				})
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

	.hint {
		font-size: 24rpx;
		color: #86909c;
		margin-top: 12rpx;
		line-height: 1.5;
	}

	.textarea {
		width: 100%;
		min-height: 240rpx;
		background: #f8f9fc;
		border-radius: 16rpx;
		padding: 22rpx;
		font-size: 28rpx;
		box-sizing: border-box;
		border: 1px solid #eef0f4;
	}

	.count {
		text-align: right;
		color: #c0c4cc;
		font-size: 22rpx;
		margin-top: 8rpx;
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
