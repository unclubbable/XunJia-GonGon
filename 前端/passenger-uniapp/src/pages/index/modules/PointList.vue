<template>
	<view :class="['point-search', {'point-search_show': myVisible}]">
		<!-- 半透明遮罩层，点击关闭 -->
		<view class="mask" @click="myVisible = false"></view>
		
		<view class="search-container">
			<!-- 顶部搜索栏 -->
			<view class="search-header">
				<view class="city-selector" @click="handleCity">
					<text class="city-name">{{ city.name }}</text>
					<uni-icons type="arrowdown" size="14" color="#6c757d" />
				</view>
				<view class="search-input-wrapper">
					<uni-icons type="search" size="16" color="#adb5bd" class="search-icon" />
					<input 
						class="search-input" 
						v-model="searchStr" 
						@input="handleSearch" 
						placeholder="请输入关键词搜索"
						placeholder-class="search-placeholder"
					/>
				</view>
				<text class="cancel-btn" @click="myVisible = false">取消</text>
			</view>
			
			<!-- 搜索结果列表 -->
			<scroll-view scroll-y class="result-list" v-if="searchList.length">
				<view 
					class="point-item" 
					v-for="item in searchList" 
					:key="item.id" 
					@click="handleChangePoint(item)"
				>
					<view class="point-item--icon">
						<uni-icons type="location" size="20" color="#3c7e8c" />
					</view>
					<view class="point-item--info">
						<text class="point-item--name">{{ item.name }}</text>
						<text class="point-item--address">{{ item.address }}</text>
					</view>
					<uni-icons type="forward" size="14" color="#adb5bd" />
				</view>
			</scroll-view>
			
			<!-- 空状态提示 -->
			<view class="empty-state" v-else-if="searchStr && !searchList.length">
				<uni-icons type="search" size="48" color="#dee2e6" />
				<text>未找到相关地点</text>
			</view>
			
			<!-- 默认提示 -->
			<view class="empty-state" v-else>
				<uni-icons type="location" size="48" color="#dee2e6" />
				<text>输入关键词搜索地点</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
});
const emits = defineEmits(['change', 'update:visible']);
const store = useStore();
//从父组件中获取通过 provide 提供的值--map组件中的search函数
const mapSearch = inject('mapSearch');

const city = computed(() => store.state.city);
const myVisible = computed({
	get: () => props.visible,
	set: (val) => emits('update:visible', val)
});

const searchStr = ref('');
const searchList = ref([]);

const handleSearch = () => {
	if (!searchStr.value.trim()) {
		searchList.value = [];
		return;
	}
	mapSearch(searchStr.value, (result) => {
		searchList.value = result.pois || [];
	});
};

const handleChangePoint = (item) => {
	emits('change', item);
	myVisible.value = false;
};

const handleCity = () => {
	uni.navigateTo({ url: '/pages/city' });
};
</script>

<style scoped lang="scss">
.point-search {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 999;
	visibility: hidden;
	transition: visibility 0.3s;
	
	&_show {
		visibility: visible;
		
		.search-container {
			transform: translateY(0);
		}
	}
}

// 半透明遮罩
.mask {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(2px);
}

// 搜索面板容器
.search-container {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 80vh;
	background: #ffffff;
	border-radius: 32rpx 32rpx 0 0;
	display: flex;
	flex-direction: column;
	transform: translateY(100%);
	transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.08);
}

// 顶部搜索栏
.search-header {
	display: flex;
	align-items: center;
	padding: 24rpx 32rpx;
	gap: 16rpx;
	border-bottom: 1rpx solid #f0f0f0;
	
	.city-selector {
		display: flex;
		align-items: center;
		gap: 6rpx;
		padding: 12rpx 16rpx;
		background: #f8f9fa;
		border-radius: 48rpx;
		flex-shrink: 0;
		
		.city-name {
			font-size: 28rpx;
			color: #2c3e50;
			font-weight: 500;
			max-width: 120rpx;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
	
	.search-input-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		background: #f8f9fa;
		border-radius: 48rpx;
		padding: 12rpx 20rpx;
		gap: 12rpx;
		
		.search-icon {
			flex-shrink: 0;
		}
		
		.search-input {
			flex: 1;
			font-size: 28rpx;
			color: #1f2f3d;
			height: 48rpx;
			
			&::placeholder {
				color: #adb5bd;
			}
		}
	}
	
	.cancel-btn {
		font-size: 28rpx;
		color: #5c9ebd;
		flex-shrink: 0;
		padding: 12rpx 0;
		
		&:active {
			opacity: 0.6;
		}
	}
}

// 搜索结果列表
.result-list {
	flex: 1;
	padding: 0 16rpx;
}

.point-item {
	display: flex;
	align-items: center;
	padding: 28rpx 24rpx;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 0.2s;
	
	&:active {
		background: #f8f9fa;
	}
	
	&--icon {
		margin-right: 24rpx;
		flex-shrink: 0;
	}
	
	&--info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}
	
	&--name {
		font-size: 32rpx;
		font-weight: 500;
		color: #2c3e50;
	}
	
	&--address {
		font-size: 26rpx;
		color: #86909c;
		line-height: 1.4;
	}
}

// 空状态
.empty-state {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 24rpx;
	padding: 80rpx 0;
	
	text {
		font-size: 28rpx;
		color: #adb5bd;
	}
}

// 滚动条隐藏（可选）
.result-list::-webkit-scrollbar {
	width: 0;
	background: transparent;
}
</style>