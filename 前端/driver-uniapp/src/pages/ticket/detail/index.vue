<template>
	<view class="page" v-if="ticket">
		<view class="card card--hero">
			<view class="row">
				<text class="no">{{ ticket.ticketNo }}</text>
				<text class="status">{{ statusText(ticket.status) }}</text>
			</view>
			<view class="title">{{ ticket.title }}</view>
			<view class="meta-tag">{{ categoryLabel(DRIVER_CATEGORIES, ticket.category) }}</view>
			<view class="content">{{ ticket.content }}</view>
			<view v-if="ticket.requestPayload" class="meta-block">申请数据：{{ ticket.requestPayload }}</view>
			<view v-if="ticket.resultSummary" class="result">处理结果：{{ ticket.resultSummary }}</view>
			<view v-if="ticket.rejectReason" class="result danger">驳回原因：{{ ticket.rejectReason }}</view>
		</view>

		<view class="card">
			<view class="section">
				<view class="section-icon">
					<uni-icons type="chatboxes" size="18" color="#318eff" />
				</view>
				<text>沟通记录</text>
			</view>
			<view v-for="msg in messages" :key="msg.id" class="msg">
				<view class="msg-head">
					<text class="sender">{{ senderLabel(msg.senderType) }}</text>
					<text class="time">{{ msg.gmtCreate }}</text>
				</view>
				<text class="msg-body">{{ msg.content }}</text>
			</view>
			<view v-if="!messages.length" class="empty">暂无消息</view>
		</view>

		<view v-if="canAppend" class="card">
			<view class="section">
				<view class="section-icon">
					<uni-icons type="compose" size="18" color="#318eff" />
				</view>
				<text>补充说明</text>
			</view>
			<textarea class="textarea" v-model="appendText" maxlength="300" placeholder="补充说明" />
			<button class="btn" :loading="busy" @click="handleAppend">发送补充</button>
		</view>

		<button v-if="ticket.status === 'OPEN'" class="btn cancel" :loading="busy" @click="handleCancel">撤销工单</button>
	</view>
</template>


<script setup>
	import { computed, ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { ApiTicketMyDetail, ApiTicketAppendMessage, ApiTicketCancel } from '../../../api/ticket'
	import { DRIVER_CATEGORIES, statusText, categoryLabel } from '../../../utils/ticketDict'
	import { ShowToast } from '../../../utils'

	const ticketId = ref(null)
	const ticket = ref(null)
	const messages = ref([])
	const appendText = ref('')
	const busy = ref(false)

	const canAppend = computed(() => {
		const s = ticket.value?.status
		return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'PENDING_USER'
	})

	const load = async () => {
		const { error, result } = await ApiTicketMyDetail(ticketId.value)
		if (error) return
		ticket.value = result?.ticket
		messages.value = result?.messages || []
	}

	const senderLabel = (type) => {
		const map = { 1: '乘客', 2: '我', 3: '平台', 4: '系统' }
		return map[type] || '未知'
	}

	const handleAppend = async () => {
		const content = appendText.value.trim()
		if (!content) {
			ShowToast('请输入内容')
			return
		}
		busy.value = true
		try {
			const { error } = await ApiTicketAppendMessage({ ticketId: ticketId.value, content })
			if (error) return
			appendText.value = ''
			ShowToast('已发送')
			await load()
		} finally {
			busy.value = false
		}
	}

	const handleCancel = async () => {
		uni.showModal({
			title: '确认撤销？',
			success: async (res) => {
				if (!res.confirm) return
				busy.value = true
				try {
					const { error } = await ApiTicketCancel(ticketId.value)
					if (error) return
					ShowToast('已撤销')
					await load()
				} finally {
					busy.value = false
				}
			}
		})
	}

	onLoad((query) => {
		ticketId.value = Number(query?.ticketId)
		if (ticketId.value) load()
	})
</script>

<style lang="scss" scoped>
	.page {
		min-height: 100vh;
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		padding: 24rpx 32rpx 60rpx;
		box-sizing: border-box;
	}

	.card {
		background: #fff;
		border-radius: 28rpx;
		padding: 32rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);
	}

	.card--hero {
		border: 1px solid #e8f3ff;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
		margin: 16rpx 0 12rpx;
		font-size: 34rpx;
		font-weight: 700;
		color: #1f2f3d;
	}

	.meta-tag {
		display: inline-block;
		font-size: 22rpx;
		color: #595959;
		background: #f5f7fa;
		padding: 6rpx 16rpx;
		border-radius: 8rpx;
		margin-bottom: 16rpx;
	}

	.content,
	.msg-body {
		margin-top: 12rpx;
		font-size: 28rpx;
		color: #303133;
		line-height: 1.65;
	}

	.meta-block {
		margin-top: 16rpx;
		font-size: 24rpx;
		color: #86909c;
		background: #f8f9fc;
		padding: 16rpx 20rpx;
		border-radius: 12rpx;
		word-break: break-all;
	}

	.result {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: #318eff;
		background: #e8f3ff;
		padding: 16rpx 20rpx;
		border-radius: 12rpx;
		line-height: 1.5;
	}

	.result.danger {
		color: #ff4d4f;
		background: #fff2f0;
	}

	.section {
		display: flex;
		align-items: center;
		gap: 12rpx;
		font-weight: 600;
		font-size: 30rpx;
		color: #1f2f3d;
		margin-bottom: 20rpx;
	}

	.section-icon {
		width: 48rpx;
		height: 48rpx;
		border-radius: 12rpx;
		background: #e8f3ff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.msg {
		padding: 20rpx;
		margin-bottom: 12rpx;
		background: #f8f9fc;
		border-radius: 16rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.msg-head {
		display: flex;
		justify-content: space-between;
		font-size: 24rpx;
		color: #86909c;
		margin-bottom: 8rpx;
	}

	.sender {
		color: #318eff;
		font-weight: 500;
	}

	.time,
	.empty {
		font-size: 24rpx;
		color: #86909c;
	}

	.empty {
		text-align: center;
		padding: 32rpx 0;
	}

	.textarea {
		width: 100%;
		min-height: 160rpx;
		background: #f8f9fc;
		border-radius: 16rpx;
		padding: 20rpx;
		box-sizing: border-box;
		margin-bottom: 20rpx;
		border: 1px solid #eef0f4;
		font-size: 28rpx;
	}

	.btn {
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

	.btn.cancel {
		background: #fff;
		color: #ff4d4f;
		border: 1px solid rgba(255, 77, 79, 0.3);
		box-shadow: 0 4rpx 16rpx rgba(255, 77, 79, 0.08);
		margin-top: 8rpx;

		&:active {
			background: #fff2f0;
		}
	}
</style>
