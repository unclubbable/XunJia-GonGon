<template>
	<view class="city-page">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">设置运营城市</text>
			<text class="page-subtitle">选择您的主要服务区域</text>
		</view>

		<!-- 城市选择卡片 -->
		<uni-card :is-full="true" :border="false" class="city-card">
			<uni-forms label-width="0">
				<uni-forms-item>
					<uni-easyinput 
						v-model="searchStr" 
						placeholder="请输入城市名称搜索"
						clearable
						@focus="showList = true"
						@blur="handleBlur"
					>
						<template v-slot:left>
							<uni-icons type="search" size="18" color="#86909c" />
						</template>
					</uni-easyinput>
				</uni-forms-item>
			</uni-forms>

			<!-- 城市列表 -->
			<view class="city-list-wrapper" v-show="showList && filterList.length">
				<scroll-view scroll-y class="city-list">
					<uni-list :border="false">
						<uni-list-item 
							v-for="item in filterList" 
							:key="item.adcode"
							:title="item.name"
							clickable
							@click="handleCity(item)"
						/>
					</uni-list>
				</scroll-view>
			</view>

			<!-- 无匹配结果提示 -->
			<view class="empty-tip" v-if="showList && searchStr && !filterList.length">
				<uni-icons type="search" size="32" color="#dee2e6" />
				<text>未找到相关城市</text>
			</view>
		</uni-card>

		<!-- 提交按钮 -->
		<view class="submit-wrapper">
			<button class="submit-btn" @click="handleSubmit">保存城市</button>
		</view>
	</view>
</template>

<script setup>
import { onMounted, ref, computed, nextTick } from "vue";
import { useStore } from "vuex";
import { ApiGetWorkStatus, ApiPostUpdateWorkCity } from '../api/user';
import gdMapConf from "../config/gdMapConf";

const $store = useStore();
const userInfo = computed(() => $store.state.userInfo);
const cityList = ref([]);
const searchStr = ref('');
const selectedCityCode = ref('');		//保存城市代码
const selectedCityName = ref('');		//保存城市名字
const selectedAdCode = ref(''); 		//保存行政区代码
const showList = ref(false);

// 过滤后的城市列表(供表单使用)
const filterList = computed(() => {
	if (!searchStr.value) return cityList.value;
	return cityList.value.filter(item => item.name.includes(searchStr.value));
});

onMounted(() => {
	getCityList();
	getCurrentCity();
});

// 获取所有城市列表（从高德）
const getCityList = () => {
	uni.request({
		method: 'GET',
		url: `${gdMapConf.cityApiUrl}?subdistrict=2&key=${gdMapConf.cityKey}`,
		success(res) {
			cityList.value = formatCity(res.data.districts[0].districts).sort((a, b) => {
				return a.name.localeCompare(b.name, 'zh-CN');
			});
		},
		fail(err) {
			console.log("获取城市列表失败", err);
		}
	});
};

// 格式化行政区数据
const formatCity = (data) => {
	let arr = [];
	data.forEach(i => {
		if (i.citycode.length) {
			arr.push(i);
		}
		if (i.districts.length) {
			arr = arr.concat(formatCity(i.districts));
		}
	});
	return arr;
};

// 获取当前运营城市
const getCurrentCity = async () => {
	const { error, result } = await ApiGetWorkStatus({ driverId: userInfo.value.driverId });
	if (!error && result) {
		searchStr.value = result.adname;
		selectedCityCode.value = result.citycode;
		selectedCityName.value = result.adname;
	}
};

// 选择城市
const handleCity = (item) => {
	console.log(item);
	nextTick(() => {
		searchStr.value = item.name;
		selectedCityCode.value = item.citycode;
		selectedCityName.value = item.name;
		selectedAdCode.value = item.adcode;
		showList.value = false;
	});
};

// 输入框失焦处理（延时关闭列表，避免点击选项时立即关闭）
let blurTimer = null;
const handleBlur = () => {
	blurTimer = setTimeout(() => {
		showList.value = false;
	}, 200);
};

// 提交城市
const handleSubmit = async () => {
	if (!selectedCityCode.value) {
		uni.showToast({ title: '请先选择城市', icon: 'none' });
		return;
	}
	const { error } = await ApiPostUpdateWorkCity({
		driverId: userInfo.value.driverId,
		citycode: selectedCityCode.value,
		adname: selectedCityName.value,
		adcode: selectedAdCode.value
	});
	if (!error) {
		uni.showToast({ title: '提交成功', icon: 'success' });
		setTimeout(() => {
			uni.navigateBack({ delta: 1 });
		}, 600);
	} else {
		uni.showToast({ title: '提交失败，请重试', icon: 'none' });
	}
};
</script>

<style lang="scss" scoped>
.city-page {
	min-height: 100vh;
	background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
	padding: 30rpx 32rpx 60rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.page-header {
	margin-bottom: 32rpx;
	text-align: center;
	
	.page-title {
		font-size: 48rpx;
		font-weight: 700;
		color: #1f2f3d;
		display: block;
		margin-bottom: 12rpx;
	}
	
	.page-subtitle {
		font-size: 26rpx;
		color: #86909c;
		background: #f0f2f5;
		padding: 8rpx 20rpx;
		border-radius: 40rpx;
	}
}

.city-card {
	background: #ffffff;
	border-radius: 32rpx;
	padding: 32rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
	margin-bottom: 48rpx;
	flex: 1;
	
	:deep(.uni-forms-item) {
		margin-bottom: 24rpx;
	}
	
	:deep(.uni-easyinput) {
		background: #f8f9fa;
		border-radius: 48rpx;
		border: 1px solid #e9ecef;
		
		&.is-focus {
			border-color: #5c9ebd;
			box-shadow: 0 0 0 2px rgba(92, 158, 189, 0.1);
		}
	}
	
	.city-list-wrapper {
		max-height: 500rpx;
		margin-top: 16rpx;
		border-radius: 24rpx;
		overflow: hidden;
		background: #f8f9fa;
		
		.city-list {
			max-height: 500rpx;
		}
		
		:deep(.uni-list) {
			background: transparent;
			
			&::before,
			&::after {
				display: none;
			}
		}
		
		:deep(.uni-list-item) {
			padding: 20rpx 24rpx;
			border-bottom: 1rpx solid #e9ecef;
			
			.uni-list-item__content-title {
				font-size: 28rpx;
				color: #2c3e50;
			}
			
			&:active {
				background: #eef2f6;
			}
		}
	}
	
	.empty-tip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
		padding: 60rpx 0;
		color: #adb5bd;
		font-size: 28rpx;
	}
}

.submit-wrapper {
	margin-top: auto;
	
	.submit-btn {
		background: linear-gradient(135deg, #5c9ebd, #3c7e8c);
		color: white;
		font-size: 32rpx;
		font-weight: 600;
		border-radius: 60rpx;
		height: 96rpx;
		line-height: 96rpx;
		border: none;
		box-shadow: 0 8rpx 20rpx rgba(60, 126, 140, 0.25);
		transition: all 0.2s ease;
		
		&::after {
			border: none;
		}
		
		&:active {
			transform: scale(0.97);
			opacity: 0.9;
		}
	}
}
</style>