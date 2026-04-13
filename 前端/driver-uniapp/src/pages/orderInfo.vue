<template>
  <view class="order-info">
    <!-- 顶部筛选分段器  -->
    <view class="top-scroll">
      <view class="top-tab" :class="{ active: currentFilter === 'all' }" @tap="filterOrders('all')">全部</view>
      <view class="top-tab" :class="{ active: currentFilter === 'ongoing' }" @tap="filterOrders('ongoing')">进行中</view>
      <view class="top-tab" :class="{ active: currentFilter === 'completed' }" @tap="filterOrders('completed')">已完成</view>
      <view class="top-tab" :class="{ active: currentFilter === 'canceled' }" @tap="filterOrders('canceled')">已取消</view>
    </view>

    <!-- 消息组件 -->
    <BSseMessage @receiveOrder="handleReceiveOrder" />

    <!-- 订单列表 -->
    <view class="order-list" v-if="filteredOrders.length">
      <view v-for="order in filteredOrders" :key="order.id" class="order-item">
        <view class="order-header" >
          <view class="header-left">
            <text class="company-name">迅家出行</text>
            <!-- 自定义标签 -->
            <view class="order-tag" :class="getOrderStatusClass(order.orderStatus)">
              {{ getOrderStatusText(order.orderStatus) }}
            </view>
          </view>
          <view class="header-right">
            <text class="order-price" v-if="order.orderStatus == 8 || order.orderStatus == 7">{{ order.price }} 元</text>
            <text class="iconfont icon-jinru" @click="goToOrderDetail(order.id)"></text>
          </view>
        </view>
        <view class="order-details">
          <view class="order-date">{{ order.orderTime }}</view>
          <view class="route">
            <view class="start">
              <text>{{ order.departure }}</text>
            </view>
            <view class="end">
              <text>{{ order.destination }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 自定义空状态 -->
    <view v-else class="empty-state">
      <image class="empty-image" src="/static/empty-order.png" mode="aspectFit" />
      <text class="empty-text">{{ emptyText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import BSseMessage from '../component/BSseMessage.vue';
import { ApiGetAllOrderInfo } from '../api/order';
import { onShow } from '@dcloudio/uni-app';
import { HandleApiError } from '../utils';
//订单列表
const orders = ref([]);
//存储当前选中的订单筛选类型，默认值是 'all'全部
const currentFilter = ref('all');

// 空状态文案
const emptyText = computed(() => {
  const map = {
    all: '暂无订单',
    ongoing: '暂无进行中的订单',
    completed: '暂无已完成的订单',
    canceled: '暂无已取消的订单'
  };
  return map[currentFilter.value] || '暂无订单';
});
//回调函数
onShow(() => {
  fetchAllOrders();
});
//获取订单
const fetchAllOrders = async () => {
  const { error, result } = await ApiGetAllOrderInfo();
  if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
	const filteredOrders = result.filter(order => order.orderStatus !== 0);
	orders.value = filteredOrders;
  }
};

//切换标签
const filterOrders = (status) => {
  currentFilter.value = status;
};
//筛选订单到不同阶段
const filteredOrders = computed(() => {
  if (currentFilter.value === 'all') return orders.value;
  const statusMap = {
    ongoing: [3, 4, 5, 6],
    completed: [8],
    canceled: [9]
  };
  const allowedStatus = statusMap[currentFilter.value];
  return orders.value.filter(order => allowedStatus.includes(order.orderStatus));
});
//订单状态
const getOrderStatusText = (status) => {
  switch (status) {
    case 1: return '待接单';
    case 2: return '已接单';
    case 3: case 4: case 5: case 6: return '进行中';
    case 7: return '待支付';
    case 8: return '已完成';
    case 9: return '已取消';
    default: return '订单无效';
  }
};
//订单状态颜色
const getOrderStatusClass = (status) => {
  switch (status) {
    case 1: case 2: case 3: case 4: case 5: case 6: case 7: return 'tag-warning';
    case 8: return 'tag-success';
    case 9: return 'tag-error';
    default: return '';
  }
};
//跳转订单详情（点击跳转）
const goToOrderDetail = (orderId) => {
  uni.navigateTo({ url: `/pages/orderDetail?orderId=${orderId}` });
};
//跳转订单详情（websockt跳转）
const handleReceiveOrder = (arg) => {
  if (arg && arg.orderId) {
    uni.redirectTo({ url: `/pages/orderDetail?orderId=${arg.orderId}` });
  }
};
</script>

<style lang="scss" scoped>
.order-info {
  min-height: 100vh;
  background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
  padding: 20rpx 32rpx 40rpx;
}

/* 顶部标签栏 */
.top-scroll {
  display: flex;
  background: #ffffff;
  border-radius: 80rpx;
  margin-bottom: 24rpx;
  padding: 8rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.top-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #86909c;
  border-radius: 60rpx;
  transition: all 0.2s;
  cursor: pointer;

  &.active {
    background: #3c7e8c;
    color: #ffffff;
    font-weight: 500;
  }
}

/* 订单列表 */
.order-list {
  margin-top: 20rpx;
}

.order-item {
  background: #ffffff;
  border-radius: 32rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.04);
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .company-name {
      font-size: 34rpx;
      font-weight: 600;
      color: #1f2f3d;
    }

    .order-tag {
      padding: 4rpx 16rpx;
      border-radius: 40rpx;
      font-size: 24rpx;
      background: #f0f2f5;
      color: #86909c;

      &.tag-warning {
        background: #fff7e6;
        color: #ffa64d;
      }
      &.tag-success {
        background: #e8f5e9;
        color: #52c41a;
      }
      &.tag-error {
        background: #ffebe9;
        color: #f35f5f;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 20rpx;

    .order-price {
      font-size: 32rpx;
      font-weight: 600;
      color: #5c9ebd;
    }

    .icon-jinru {
      font-size: 32rpx;
      color: #adb5bd;
      cursor: pointer;
    }
  }
}

.order-details {
  .order-date {
    font-size: 26rpx;
    color: #86909c;
    margin-bottom: 16rpx;
  }

  .route {
    .start, .end {
      display: flex;
      align-items: center;
      gap: 12rpx;
      margin-bottom: 12rpx;
      font-size: 28rpx;
      color: #2c3e50;

      &::before {
        content: '';
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        background: #52c41a;
      }
    }
    .end::before {
      background: #ffa64d;
    }
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;

  .empty-image {
    width: 240rpx;
    height: 240rpx;
    margin-bottom: 32rpx;
  }

  .empty-text {
    font-size: 28rpx;
    color: #adb5bd;
  }
}
</style>