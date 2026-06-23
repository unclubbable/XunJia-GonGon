<template>
  <view class="order-info">
    <!-- 顶部筛选标签（横向滚动） -->
    <scroll-view scroll-x class="top-scroll" show-scrollbar="false">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="top-tab"
        :class="{ active: currentFilter === tab.key }"
        @tap="filterOrders(tab.key)"
      >
        <text>{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view v-for="order in filteredOrders" :key="order.id" class="order-card">
        <view class="order-header">
          <view class="header-left">
            <text class="company-name">迅家出行</text>
            <view class="order-status" :class="getStatusClass(order.orderStatus)">
              {{ getOrderStatusText(order.orderStatus) }}
            </view>
          </view>
          <view class="header-right">
            <text class="order-price" v-if="order.orderStatus == 8 || order.orderStatus == 7">
              {{ order.price }} 元
            </text>
            <text class="iconfont icon-jinru arrow-icon" @tap="goToOrderDetail(order.id)"></text>
          </view>
        </view>

        <view class="order-details">
          <view class="order-date">
            <uni-icons type="calendar" size="14" color="#86909c" />
            <text>{{ order.orderTime }}</text>
          </view>
          <view class="route">
            <view class="start">
              <view class="dot start-dot"></view>
              <text>{{ order.departure }}</text>
            </view>
            <view class="end">
              <view class="dot end-dot"></view>
              <text>{{ order.destination }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态提示 -->
      <view v-if="!filteredOrders.length" class="empty-state">
        <image src="/static/empty-order.png" mode="aspectFit" class="empty-image" />
        <text class="empty-text">暂无订单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ApiGetAllOrderInfo } from '../api/order';
import { onShow } from '@dcloudio/uni-app';
import { HandleApiError } from '../utils';

// 标签配置
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'accepted', label: '已接单' },
  { key: 'ongoing', label: '进行中' },
  { key: 'pendingPayment', label: '待支付' },
  { key: 'completed', label: '已完成' },
  { key: 'canceled', label: '已取消' }
];

const orders = ref([]);
const currentFilter = ref('all');

onShow(() => {
  fetchAllOrders();
});

const fetchAllOrders = async () => {
  const { error, result } = await ApiGetAllOrderInfo();
  if (!HandleApiError(error) && !result.hasOwnProperty("code")) {
    orders.value = result;
  }
};

// 筛选逻辑
const filteredOrders = computed(() => {
  if (currentFilter.value === 'all') return orders.value;
  const filterStatus = getOrderStatusValue(currentFilter.value);
  if (Array.isArray(filterStatus)) {
    return orders.value.filter(order => filterStatus.includes(order.orderStatus));
  } else {
    return orders.value.filter(order => order.orderStatus === filterStatus);
  }
});

const filterOrders = (status) => {
  currentFilter.value = status;
};

// 状态文本
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

// 状态值映射
const getOrderStatusValue = (text) => {
  switch (text) {
    case 'pending': return 1;
    case 'accepted': return 2;
    case 'ongoing': return [3, 4, 5, 6];
    case 'pendingPayment': return 7;
    case 'completed': return 8;
    case 'canceled': return 9;
    default: return 0;
  }
};

// 状态样式类名
const getStatusClass = (status) => {
  switch (status) {
    case 1: case 2: case 3: case 4: case 5: case 6: case 7:
      return 'status-warning';
    case 8:
      return 'status-success';
    case 9:
      return 'status-error';
    default:
      return '';
  }
};

const goToOrderDetail = (orderId) => {
  uni.navigateTo({ url: `/pages/orderDetail?orderId=${orderId}` });
};
</script>

<style lang="scss" scoped>
.order-info {
  min-height: 100vh;
  background: linear-gradient(145deg, #f5f7fc 0%, #eef2f6 100%);
  padding: 20rpx 0 40rpx;
}

/* 顶部标签栏 */
.top-scroll {
  white-space: nowrap;
  padding: 0 24rpx 20rpx;
  background: transparent;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.top-tab {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  font-size: 28rpx;
  color: #6c757d;
  background: #ffffff;
  border-radius: 60rpx;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);
  
  &.active {
    background: #3c7e8c;
    color: #ffffff;
    font-weight: 500;
    box-shadow: 0 4rpx 12rpx rgba(60, 126, 140, 0.2);
  }
  
  &:active {
    transform: scale(0.96);
  }
}

/* 订单列表 */
.order-list {
  padding: 0 24rpx;
}

.order-card {
  background: #ffffff;
  border-radius: 32rpx;
  margin-bottom: 24rpx;
  padding: 28rpx 32rpx;
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
    flex-wrap: wrap;
    
    .company-name {
      font-size: 34rpx;
      font-weight: 600;
      color: #1f2f3d;
    }
    
    .order-status {
      padding: 6rpx 20rpx;
      border-radius: 40rpx;
      font-size: 24rpx;
      font-weight: 500;
      
      &.status-warning {
        background: #fff7e6;
        color: #ffa64d;
      }
      &.status-success {
        background: #e8f5e9;
        color: #52c41a;
      }
      &.status-error {
        background: #ffebe9;
        color: #f35f5f;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .order-price {
      font-size: 32rpx;
      font-weight: 600;
      color: #5c9ebd;
    }
    
    .arrow-icon {
      font-size: 32rpx;
      color: #adb5bd;
      cursor: pointer;
      transition: all 0.2s;
      
      &:active {
        opacity: 0.6;
      }
    }
  }
}

.order-details {
  .order-date {
    display: flex;
    align-items: center;
    gap: 8rpx;
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
      
      .dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 50%;
        flex-shrink: 0;
        
        &.start-dot {
          background: #52c41a;
        }
        &.end-dot {
          background: #ffa64d;
        }
      }
      
      text {
        flex: 1;
        line-height: 1.4;
      }
    }
    .end {
      margin-bottom: 0;
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