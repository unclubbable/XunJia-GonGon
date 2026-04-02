<template>
	<view class="bottom-bar">
	  <view class="bar-item" @click="navigateToPage('/pages/index/index')" :class="{ 'active': currentPage == '/pages/index/index' }">
		<text class="iconfont icon-shouye-zhihui" :class="{ 'active-icon': currentPage == '/pages/index/index' }"></text>
		<text>首页</text>
	  </view>
	  <view class="bar-item" @click="navigateToPage('/pages/account')" :class="{ 'active': currentPage == '/pages/account' }">
		<text class="iconfont icon-tianxuangouren" :class="{ 'active-icon': currentPage == '/pages/account' }"></text>
		<text>我的</text>
	  </view>
	</view>
</template>

<script setup>
let currentPage = uni.currentPage;

const navigateToPage = (url) => {
	console.log(url);
    if (currentPage == url) {
	  return;
    }
	// 更新currentPage
	uni.currentPage = url;

	// 切换到标签页
	
	uni.switchTab({url});
};
</script>

<style scoped>

.bottom-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 120rpx;
  background-color: $uni-bg-color;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 11; /* 设置为比 SelectPoint 更高的 z-index */
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24rpx;
  color: #888;
}

.iconfont {
  font-size: 60rpx;
}

.active {
  color: #f0ad4e;  
}

.active-icon {
  color: #f0ad4e;  
}
</style>