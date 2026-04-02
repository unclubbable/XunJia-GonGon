<template>
  <view class="wallet-page">
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
        <text>暂无账单数据</text>
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
import { ApiGetUserMoney } from '../api/user.js'

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

<style scoped>
.wallet-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #e9eef5 100%);
  min-height: 100vh;
  padding: 16px;
  box-sizing: border-box;
}

/* 统计卡片网格：两列 + 第二行跨列 */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}

/* 普通卡片样式（总订单金额、平台抽成） */
.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 12px 8px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  min-width: 0;
}

/* 总收入卡片独立样式：渐变背景、居中、更饱满 */
.income-card {
  grid-column: span 2;
  background: linear-gradient(135deg, #fef9e6 0%, #fff6e0 100%);
  border: 1px solid rgba(255, 215, 150, 0.4);
  box-shadow: 0 4px 12px rgba(255, 180, 60, 0.12);
  justify-content: center;
  padding: 16px 8px;
}

/* 总收入图标专属样式 */
.income-icon-special {
  background: linear-gradient(135deg, #ffca60 0%, #ff8c00 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  font-size: 24px;
  flex-shrink: 0;
}

/* 普通卡片图标颜色 */
.income-icon {
  background: #e8f3ff;
  color: #409eff;
}
.order-icon {
  background: #fef0e6;
  color: #ff9500;
}
.commission-icon {
  background: #f0e6fa;
  color: #9c6ade;
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 总收入卡片内容紧凑居中 */
.income-card .stat-info {
  flex: 0 1 auto;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-value {
  font-weight: bold;
  color: #1e2a3e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: clamp(12px, 4vw, 16px);
}

/* 总收入金额数字颜色加深突出 */
.income-value {
  color: #e67e22;
  font-size: clamp(14px, 5vw, 20px);
}

/* 筛选器 */
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.picker-btn {
  background: white;
  padding: 8px 16px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}
.uni-icon-arrowdown {
  font-size: 12px;
  color: #999;
}

/* 滚动区域 */
.bill-scroll {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

/* 账单列表项 */
.bill-item {
  background: white;
  border-radius: 16px;
  margin-bottom: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
}

.bill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.bill-month {
  font-weight: 600;
  font-size: 16px;
  color: #2c3e50;
}
.bill-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}
.status-success {
  background: #e6f7e6;
  color: #52c41a;
}
.status-danger {
  background: #ffe6e6;
  color: #ff4d4f;
}

.bill-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #5c6b7e;
}
.detail-row .amount {
  font-weight: 500;
}
.detail-row .income {
  color: #409eff;
}
.detail-row .commission {
  color: #f56c6c;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #999;
}
</style>