<template>
  <view class="wallet-page">
    <view class="page-header">
      <text class="page-title">我的钱包</text>
      <text class="page-subtitle">收入明细与月度账单</text>
    </view>

    <!-- 统计卡片：上方两列，下方全宽（总收入独立样式） -->
    <view class="stats-grid">
      <!-- 第一行：总订单金额 + 平台抽成 -->
      <view class="stat-card" v-for="stat in [stats[1], stats[2]]" :key="stat.label">
        <view class="stat-icon" :class="stat.iconClass">
          <text class="iconfont" :class="stat.icon"></text>
        </view>
        <view class="stat-info">
          <text class="stat-label">{{ stat.label }}</text>
          <text class="stat-value">{{ formatMoney(stat.value) }}</text>
        </view>
      </view>
      <!-- 第二行：总收入（独立样式，居中、渐变背景、醒目图标） -->
      <view class="stat-card income-card full-width">
        <view class="stat-icon income-icon-special">
          <text class="iconfont icon-jinbi"></text>
        </view>
        <view class="stat-info">
          <text class="stat-label">总收入</text>
          <text class="stat-value income-value">{{ formatMoney(stats[0].value) }}</text>
        </view>
      </view>
    </view>

    <!-- 月份筛选器（使用 picker） -->
    <view class="filter-bar">
      <text class="filter-label">账单范围</text>
      <picker :range="monthOptions" :range-key="'text'" @change="onMonthChange">
        <view class="picker-btn">
          <text>{{ monthOptions[currentMonthIndex].text }}</text>
          <text class="uni-icon uni-icon-arrowdown"></text>
        </view>
      </picker>
    </view>

    <!-- 账单列表（scroll-view + 下拉刷新） -->
    <scroll-view 
      scroll-y 
      class="bill-scroll" 
      :refresher-enabled="true"
      :refresher-triggered="loading"
      @refresherrefresh="onRefresh"
    >
      <view v-if="monthlyData.length === 0 && !loading" class="empty-state">
        <view class="empty-icon">📋</view>
        <text class="empty-title">暂无账单数据</text>
        <text class="empty-desc">切换时间范围或完成订单后查看</text>
      </view>
      <view v-else class="bill-list">
        <view class="bill-item" v-for="item in monthlyData" :key="item.id">
          <view class="bill-header">
            <text class="bill-month">{{ item.year }}年{{ item.month }}月</text>
            <text class="bill-status" :class="item.status === 1 ? 'status-success' : 'status-danger'">
              {{ item.status === 1 ? '已发放' : '未发放' }}
            </text>
          </view>
          <view class="bill-details">
            <view class="detail-row">
              <text>订单总金额</text>
              <text class="amount">{{ formatMoney(item.totalOrderAmount) }}</text>
            </view>
            <view class="detail-row">
              <text>司机收入</text>
              <text class="amount income">{{ formatMoney(item.driverIncome) }}</text>
            </view>
            <view class="detail-row">
              <text>平台抽成</text>
              <text class="amount commission">{{ formatMoney(item.platformCommission) }}</text>
            </view>
          </view>
        </view>
      </view>
      <uni-load-more :status="loadMoreStatus" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { ApiGetUserMoney } from '../../../api/user.js'

const store = useStore()
const userInfo = computed(() => store.state.userInfo)
const driverId = computed(() => userInfo.value?.driverId)

// 数据
const loading = ref(false)
const monthlyData = ref([])
const currentMonthIndex = ref(0)
const monthOptions = [
  { text: '最近3个月', value: 3 },
  { text: '最近6个月', value: 6 },
  { text: '最近12个月', value: 12 },
]

const loadMoreStatus = ref('noMore')

// 统计数据（顺序：总收入、总订单金额、平台抽成）
const stats = computed(() => [
  {
    label: '总收入',
    value: monthlyData.value.reduce((sum, item) => sum + (item.driverIncome || 0), 0),
    icon: 'icon-jinbi',
    iconClass: 'income-icon',
  },
  {
    label: '总订单金额',
    value: monthlyData.value.reduce((sum, item) => sum + (item.totalOrderAmount || 0), 0),
    icon: 'icon-dingdan',
    iconClass: 'order-icon',
  },
  {
    label: '平台抽成',
    value: monthlyData.value.reduce((sum, item) => sum + (item.platformCommission || 0), 0),
    icon: 'icon-shouyi',
    iconClass: 'commission-icon',
  },
])

// 获取数据
const fetchData = async () => {
  if (loading.value) return;		//当一次请求正在进行时，后续的请求都会被忽略
  if (!driverId.value) {
    uni.showToast({ title: '用户信息未获取，请重新登录', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const { error, result } = await ApiGetUserMoney(driverId.value, monthOptions[currentMonthIndex.value].value)
    if (error) {
      uni.showToast({ title: error.message || '获取账单失败', icon: 'none' })
      monthlyData.value = []
    } else {
      monthlyData.value = result || []
    }
  } catch (err) {
    console.error(err)
    uni.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    monthlyData.value = []
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = () => {
  fetchData()
}

// 月份切换
const onMonthChange = (e) => {
  currentMonthIndex.value = e.detail.value
  fetchData()
}

// 格式化金额（分转元）
const formatMoney = (value) => {
  if (value === undefined || value === null) return '¥0.00'
  return `¥${(value / 100).toFixed(2)}`
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.wallet-page {
  min-height: 100vh;
  background: linear-gradient(165deg, #f0f4fa 0%, #e8eef5 48%, #f5f7fa 100%);
  padding: 24rpx 32rpx 48rpx;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 28rpx;
  padding: 8rpx 4rpx 0;

  .page-title {
    display: block;
    font-size: 44rpx;
    font-weight: 700;
    color: #1f2f3d;
    letter-spacing: 1rpx;
    margin-bottom: 10rpx;
  }

  .page-subtitle {
    font-size: 26rpx;
    color: #86909c;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 28rpx;
}

.stat-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24rpx;
  padding: 24rpx 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 24rpx rgba(15, 35, 52, 0.06);
  border: 1px solid rgba(232, 236, 240, 0.9);
  min-width: 0;
}

.income-card {
  grid-column: span 2;
  background: linear-gradient(135deg, #318eff 0%, #1a6fe8 100%);
  border: none;
  box-shadow: 0 12rpx 32rpx rgba(49, 142, 255, 0.28);
  justify-content: center;
  padding: 32rpx 24rpx;
}

.income-icon-special {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  box-shadow: none;
}

.stat-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  font-size: 36rpx;
  flex-shrink: 0;
}

.income-icon {
  background: #e8f3ff;
  color: #318eff;
}

.order-icon {
  background: #fff7e6;
  color: #fa8c16;
}

.commission-icon {
  background: #f9f0ff;
  color: #9254de;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.income-card .stat-info {
  flex: 0 1 auto;
}

.stat-label {
  font-size: 24rpx;
  color: #86909c;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.income-card .stat-label {
  color: rgba(255, 255, 255, 0.85);
}

.stat-value {
  font-weight: 700;
  color: #1f2f3d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(24rpx, 4vw, 32rpx);
}

.income-value {
  color: #fff;
  font-size: clamp(32rpx, 5.5vw, 44rpx);
}

.filter-bar {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 20rpx;
  padding: 20rpx 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(15, 35, 52, 0.05);
  border: 1px solid rgba(232, 236, 240, 0.95);
}

.filter-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2f3d;
}

.picker-btn {
  background: #e8f3ff;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: #318eff;
  font-weight: 500;
}

.uni-icon-arrowdown {
  font-size: 22rpx;
  color: #318eff;
  opacity: 0.7;
}

.bill-scroll {
  height: calc(100vh - 520rpx);
  overflow-y: auto;
}

.bill-item {
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 35, 52, 0.05);
  border: 1px solid rgba(232, 236, 240, 0.9);
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1px solid #f0f2f5;
}

.bill-month {
  font-weight: 700;
  font-size: 32rpx;
  color: #1f2f3d;
}

.bill-status {
  font-size: 22rpx;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-weight: 500;
}

.status-success {
  background: #f6ffed;
  color: #52c41a;
}

.status-danger {
  background: #fff2f0;
  color: #ff4d4f;
}

.bill-details {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 28rpx;
  color: #595959;
}

.detail-row .amount {
  font-weight: 600;
  color: #1f2f3d;
}

.detail-row .income {
  color: #318eff;
  font-size: 30rpx;
}

.detail-row .commission {
  color: #ff7875;
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 35, 52, 0.04);
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 20rpx;
  opacity: 0.6;
}

.empty-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1f2f3d;
  margin-bottom: 12rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #86909c;
}
</style>
