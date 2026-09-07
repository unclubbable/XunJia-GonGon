<template>
	<view class="page">
		<view class="page-header">
			<text class="page-title">我的工单</text>
			<text class="page-subtitle">提交问题与进度查询</text>
		</view>

		<view class="toolbar">
			<button class="btn-create" @click="goCreate">新建工单</button>
		</view>

		<view v-if="loading" class="tip">
			<uni-icons type="spinner-cycle" size="28" color="#318eff" />
			<text>加载中...</text>
		</view>
		<view v-else-if="!list.length" class="tip tip--empty">
			<uni-icons type="list" size="48" color="#c5cdd8" />
			<text>暂无工单</text>
			<text class="tip-sub">点击上方按钮创建第一条工单</text>
		</view>
		<view
			v-for="item in list"
			:key="item.id"
			class="card"
			@click="goDetail(item.id)"
		>
			<view class="row">
				<text class="no">{{ item.ticketNo }}</text>
				<text class="status">{{ statusText(item.status) }}</text>
			</view>
			<view class="title">{{ item.title }}</view>
			<view class="meta">
				<text class="meta-tag">{{ categoryLabel(DRIVER_CATEGORIES, item.category) }}</text>
				<text v-if="item.orderId" class="meta-order">订单 #{{ item.orderId }}</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { ApiTicketMyList } from '../../../api/ticket'
	import { DRIVER_CATEGORIES, statusText, categoryLabel } from '../../../utils/ticketDict'
	import { ShowToast } from '../../../utils'

	const list = ref([])
	const loading = ref(false)

	const load = async () => {
		loading.value = true
		try {
			const { error, result } = await ApiTicketMyList({ page: 1, limit: 50 })
			if (error) return
			list.value = result?.items || []
		} catch (e) {
			ShowToast('加载失败')
		} finally {
			loading.value = false
		}
	}

	const goCreate = () => uni.navigateTo({ url: '/pages/ticket/create/index' })
	const goDetail = (id) => uni.navigateTo({ url: `/pages/ticket/detail/index?ticketId=${id}` })

	onShow(load)
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

	.toolbar {
		margin-bottom: 24rpx;
	}

	.btn-create {
		background: linear-gradient(135deg, #318eff, #1a6fe8);
		color: #fff;
		border-radius: 999rpx;
		font-size: 30rpx;
		font-weight: 600;
		height: 88rpx;
		line-height: 88rpx;
		box-shadow: 0 12rpx 28rpx rgba(49, 142, 255, 0.28);

		&::after {
			border: none;
		}

		&:active {
			opacity: 0.92;
			transform: scale(0.98);
		}
	}

	.tip {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16rpx;
		color: #86909c;
		padding: 100rpx 0;
		font-size: 28rpx;
	}

	.tip--empty .tip-sub {
		font-size: 24rpx;
		color: #c5cdd8;
	}

	.card {
		background: #fff;
		border-radius: 24rpx;
		padding: 28rpx 32rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);

		&:active {
			background: #f8fafc;
		}
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.no {
		font-size: 24rpx;
		color: #86909c;
	}

	.status {
		font-size: 22rpx;
		color: #318eff;
		font-weight: 600;
		background: #e8f3ff;
		padding: 6rpx 16rpx;
		border-radius: 999rpx;
	}

	.title {
		font-size: 30rpx;
		color: #1f2f3d;
		font-weight: 600;
		margin-bottom: 16rpx;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		font-size: 24rpx;
		color: #86909c;
	}

	.meta-tag {
		background: #f5f7fa;
		padding: 4rpx 14rpx;
		border-radius: 8rpx;
	}
</style>
