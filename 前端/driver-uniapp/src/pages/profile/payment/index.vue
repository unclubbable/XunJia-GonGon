<template>
	<view class="vehicle-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">绑定车辆信息</text>
			<text class="page-subtitle">车辆信息只读，如需修改请联系站点工作人员</text>
		</view>

		<!-- 加载状态 -->
		<view v-if="loading" class="loading-state">
			<uni-load-more status="loading" :content-text="loadingText" />
		</view>

		<!-- 无数据状态 -->
		<view v-else-if="!vehicleData || Object.keys(vehicleData).length === 0" class="empty-state">
			<uni-icons type="home" size="64" color="#dee2e6" />
			<text>暂无绑定车辆信息</text>
			<text class="empty-tip">请联系站点工作人员绑定车辆</text>
		</view>

		<!-- 车辆信息展示 -->
		<view v-else class="vehicle-content">
			<!-- 基本信息卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<template v-slot:title>
					<view class="card-header">
						<uni-icons type="home" size="20" color="#318eff" />
						<text>基本信息</text>
					</view>
				</template>
				<uni-forms :model="vehicleData" label-width="140">
					<uni-forms-item label="车牌号">
						<uni-easyinput :value="vehicleData.vehicleNo" disabled />
					</uni-forms-item>
					<uni-forms-item label="车牌颜色">
						<uni-easyinput :value="formatPlateColor(vehicleData.plateColor)" disabled />
					</uni-forms-item>
					<uni-forms-item label="车辆颜色">
						<uni-easyinput :value="formatVehicleColor(vehicleData.vehicleColor)" disabled />
					</uni-forms-item>
					<uni-forms-item label="车辆类型">
						<uni-easyinput :value="formatVehicleType(vehicleData.vehicleType)" disabled />
					</uni-forms-item>
					<uni-forms-item label="品牌/型号">
						<uni-easyinput :value="`${vehicleData.brand || ''} ${vehicleData.model || ''}`" disabled />
					</uni-forms-item>
					<uni-forms-item label="核定载客位">
						<uni-easyinput :value="vehicleData.seats ? `${vehicleData.seats}人` : ''" disabled />
					</uni-forms-item>
					<uni-forms-item label="车辆所有人">
						<uni-easyinput :value="vehicleData.ownerName" disabled />
					</uni-forms-item>
				</uni-forms>
			</uni-card>

			<!-- 技术参数卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<template v-slot:title>
					<view class="card-header">
						<uni-icons type="gear" size="20" color="#318eff" />
						<text>技术参数</text>
					</view>
				</template>
				<uni-forms :model="vehicleData" label-width="140">
					<uni-forms-item label="发动机号">
						<uni-easyinput :value="vehicleData.engineId" disabled />
					</uni-forms-item>
					<uni-forms-item label="车辆识别代号(VIN)">
						<uni-easyinput :value="vehicleData.vin" disabled />
					</uni-forms-item>
					<uni-forms-item label="燃料类型">
						<uni-easyinput :value="formatFuelType(vehicleData.fueType)" disabled />
					</uni-forms-item>
					<uni-forms-item label="发动机排量">
						<uni-easyinput :value="vehicleData.engineDisplace ? `${vehicleData.engineDisplace}ml` : ''" disabled />
					</uni-forms-item>
				</uni-forms>
			</uni-card>

			<!-- 证件信息卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<template v-slot:title>
					<view class="card-header">
						<uni-icons type="paperplane" size="20" color="#318eff" />
						<text>车辆运输证信息</text>
					</view>
				</template>
				<uni-forms :model="vehicleData" label-width="140">
					<uni-forms-item label="发证机构">
						<uni-easyinput :value="vehicleData.transAgency" disabled />
					</uni-forms-item>
					<uni-forms-item label="经营区域">
						<uni-easyinput :value="vehicleData.transArea" disabled />
					</uni-forms-item>
					<uni-forms-item label="有效期">
						<uni-easyinput :value="formatDateRange(vehicleData.transDateStart, vehicleData.transDateEnd)" disabled />
					</uni-forms-item>
					<uni-forms-item label="车辆注册日期">
						<uni-easyinput :value="vehicleData.certifyDateA" disabled />
					</uni-forms-item>
					<uni-forms-item label="初次登记日期">
						<uni-easyinput :value="vehicleData.certifyDateB" disabled />
					</uni-forms-item>
				</uni-forms>
			</uni-card>

			<!-- 维护与年检卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<template v-slot:title>
					<view class="card-header">
						<uni-icons type="calendar" size="20" color="#318eff" />
						<text>维护与年检</text>
					</view>
				</template>
				<uni-forms :model="vehicleData" label-width="140">
					<uni-forms-item label="检修状态">
						<uni-easyinput :value="formatFixState(vehicleData.fixState)" disabled />
					</uni-forms-item>
					<uni-forms-item label="下次年检时间">
						<uni-easyinput :value="vehicleData.nextFixDate" disabled />
					</uni-forms-item>
					<uni-forms-item label="年度审验状态">
						<uni-easyinput :value="formatCheckState(vehicleData.checkState)" disabled />
					</uni-forms-item>
				</uni-forms>
			</uni-card>

			<!-- 其他信息卡片 -->
			<uni-card :is-full="true" :border="false" class="info-card">
				<template v-slot:title>
					<view class="card-header">
						<uni-icons type="more-filled" size="20" color="#318eff" />
						<text>其他信息</text>
					</view>
				</template>
				<uni-forms :model="vehicleData" label-width="140">
					<uni-forms-item label="发票打印设备序列号">
						<uni-easyinput :value="vehicleData.feePrintId" disabled />
					</uni-forms-item>
				</uni-forms>
			</uni-card>

			<!-- 提示信息 -->
			<view class="info-tip">
				<view class="tip-icon-wrap">
					<uni-icons type="info" size="18" color="#318eff" />
				</view>
				<text>如需修改车辆信息，请联系当地站点工作人员进行后台处理。</text>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, onMounted,computed } from 'vue';
	import { useStore } from 'vuex';
	import {ApiGetCarInfo, ApiGetDictCarClassAll} from '../../../api/user.js'

	const $store = useStore();
	const userInfo = computed(()=> $store.state.userInfo);
	const loading = ref(true);
	const vehicleData = ref({});
	// 加载文案配置（解决 loadingText 未定义的问题）
	const loadingText = {
		contentdown: '',
		contentrefresh: '加载中...',
		contentnomore: ''
	};

	// 枚举映射
	const plateColorMap = {
		'1': '蓝色',
		'2': '黄色',
		'3': '黑色',
		'4': '白色',
		'5': '绿色',
		'9': '其他'
	};
	const vehicleColorMap = {
		'1': '白色',
		'2': '黑色'
	};
	const fuelTypeMap = {
		'1': '汽油',
		'2': '柴油',
		'3': '天然气',
		'4': '液化气',
		'5': '电动',
		'9': '其他'
	};
	const fixStateMap = {
		'0': '未检修',
		'1': '已检修',
		'2': '未知'
	};
	const checkStateMap = {
		'0': '未年审',
		'1': '年审合格',
		'2': '年审不合格'
	};
	const vehicleTypeMap = ref({})

	const formatVehicleType = (code) => vehicleTypeMap.value[code] || vehicleTypeMap.value[String(code)] || code || '未知';
	const formatPlateColor = (code) => plateColorMap[code] || code || '未知';
	const formatVehicleColor = (code) => vehicleColorMap[code] || code || '未知';
	const formatFuelType = (code) => fuelTypeMap[code] || code || '未知';
	const formatFixState = (code) => fixStateMap[code] || code || '未知';
	const formatCheckState = (code) => checkStateMap[code] || code || '未知';
	const formatDateRange = (start, end) => {
		if (!start && !end) return '';
		return `${start || '未知'} 至 ${end || '未知'}`;
	};

	const loadVehicleTypeDict = async () => {
		try {
			const { error, result } = await ApiGetDictCarClassAll();
			if (!error && Array.isArray(result)) {
				const map = {};
				result.forEach(item => {
					map[item.classCode] = item.className;
				});
				vehicleTypeMap.value = map;
			}
		} catch (e) {
			console.error('加载车辆类型字典失败', e);
		}
	};

	// 获取车辆信息
	const getVehicleInfo = async () => {
		try {
			// 实际使用时取消注释并替换为真实接口
			const { error, result } = await ApiGetCarInfo(userInfo.value.carId);
			if (!error && result) vehicleData.value = result;

			// // 演示数据（后续替换为真实数据）
			// vehicleData.value = {
			// 	vehicleNo: '鲁B12345',
			// 	plateColor: '1',
			// 	vehicleColor: '1',
			// 	vehicleType: '小型轿车',
			// 	brand: '大众',
			// 	model: '朗逸',
			// 	seats: 5,
			// 	ownerName: '张三',
			// 	engineId: 'ABC123456',
			// 	vin: 'LSVAA123456789012',
			// 	fueType: '1',
			// 	engineDisplace: '1800',
			// 	transAgency: '青岛市交通运输局',
			// 	transArea: '青岛市',
			// 	transDateStart: '2024-01-01',
			// 	transDateEnd: '2027-12-31',
			// 	certifyDateA: '2023-05-10',
			// 	certifyDateB: '2022-03-15',
			// 	fixState: '1',
			// 	nextFixDate: '2025-06-30',
			// 	checkState: '1',
			// 	feePrintId: 'PRT-2024001'
			// };
		} catch (e) {
			console.error('获取车辆信息失败', e);
		} finally {
			loading.value = false;
		}
	};

	onMounted(async () => {
		await loadVehicleTypeDict();
		getVehicleInfo();
	});
</script>

<style lang="scss" scoped>
	.vehicle-page {
		min-height: 100vh;
		background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
		padding: 30rpx 32rpx 60rpx;
		box-sizing: border-box;
	}

	.page-header {
		margin-bottom: 32rpx;
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

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 0;
		gap: 24rpx;
		color: #86909c;
		font-size: 28rpx;

		.empty-tip {
			font-size: 24rpx;
			color: #c5cdd8;
			margin-top: 8rpx;
		}
	}

	.vehicle-content {
		display: flex;
		flex-direction: column;
		gap: 24rpx;
	}

	.info-card {
		border-radius: 28rpx;
		background: #ffffff;
		box-shadow: 0 8rpx 28rpx rgba(15, 35, 52, 0.06);
		border: 1px solid rgba(232, 236, 240, 0.95);
		overflow: hidden;

		:deep(.uni-card__header) {
			padding: 28rpx 32rpx 12rpx;
			border-bottom: 1rpx solid #f0f2f5;
		}

		:deep(.uni-card__content) {
			padding: 20rpx 32rpx 32rpx;
		}

		.card-header {
			display: flex;
			align-items: center;
			gap: 12rpx;
			font-size: 30rpx;
			font-weight: 600;
			color: #1f2f3d;
		}

		:deep(.uni-forms-item) {
			margin-bottom: 24rpx;

			.uni-forms-item__label {
				font-size: 28rpx;
				font-weight: 500;
				color: #595959;
			}
		}

		:deep(.uni-easyinput) {
			background: #f8f9fc;
			border-radius: 16rpx;
			border: 1px solid #eef0f4;

			&.is-disabled {
				background: #f5f7fa;
				opacity: 1;

				.uni-easyinput__content {
					color: #1f2f3d;
					font-weight: 500;
				}
			}
		}
	}

	.info-tip {
		background: #fff;
		border-radius: 20rpx;
		padding: 24rpx 28rpx;
		margin-top: 8rpx;
		display: flex;
		align-items: flex-start;
		gap: 16rpx;
		box-shadow: 0 4rpx 16rpx rgba(15, 35, 52, 0.05);
		border: 1px solid #e8f3ff;

		.tip-icon-wrap {
			width: 48rpx;
			height: 48rpx;
			border-radius: 50%;
			background: #e8f3ff;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		text {
			flex: 1;
			font-size: 26rpx;
			color: #595959;
			line-height: 1.55;
		}
	}
</style>