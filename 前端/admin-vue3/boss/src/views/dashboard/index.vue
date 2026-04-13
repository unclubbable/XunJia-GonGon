<template>
  <div class="dashboard-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <!-- 欢迎语 -->
    <div class="welcome-section">
      <h1 class="welcome-title">欢迎回来，{{ currentTime }}</h1>
      <p class="welcome-subtitle">讯家出行 · 智慧运营中心</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card driver-card" data-aos="fade-up">
          <div class="stat-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总司机数</div>
            <div class="stat-number">{{ stats.totalDrivers }}</div>
            <div class="stat-trend">
              <span class="trend-up"><el-icon><CaretTop /></el-icon> +12%</span>
              <span>较上月</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card vehicle-card" data-aos="fade-up" data-aos-delay="100">
          <div class="stat-icon">
            <el-icon><Van /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总车辆数</div>
            <div class="stat-number">{{ stats.totalVehicles }}</div>
            <div class="stat-trend">
              <span class="trend-up"><el-icon><CaretTop /></el-icon> +8%</span>
              <span>较上月</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card order-card" data-aos="fade-up" data-aos-delay="200">
          <div class="stat-icon">
            <el-icon><List /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日订单</div>
            <div class="stat-number">{{ stats.todayOrders }}</div>
            <div class="stat-trend">
              <span class="trend-up"><el-icon><CaretTop /></el-icon> +5%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card income-card" data-aos="fade-up" data-aos-delay="300">
          <div class="stat-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日收入</div>
            <div class="stat-number">¥{{ formatMoney(stats.todayIncome) }}</div>
            <div class="stat-trend">
              <span class="trend-up"><el-icon><CaretTop /></el-icon> +10%</span>
              <span>较昨日</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="16">
        <div class="chart-card" data-aos="fade-right">
          <div class="card-header">
            <span class="card-title">订单 & 收入趋势</span>
            <el-radio-group v-model="trendType" size="small">
              <el-radio-button label="week">近7天</el-radio-button>
              <el-radio-button label="month">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="chart-card" data-aos="fade-left">
          <div class="card-header">
            <span class="card-title">在线司机占比</span>
          </div>
          <div ref="pieChartRef" class="chart-container pie-chart"></div>
          <div class="pie-legend">
            <div class="legend-item">
              <span class="legend-dot online"></span>
              <span>在线司机</span>
              <strong>{{ onlineCount }}</strong>
            </div>
            <div class="legend-item">
              <span class="legend-dot offline"></span>
              <span>离线司机</span>
              <strong>{{ offlineCount }}</strong>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 日历 + 快捷操作 -->
    <el-row :gutter="20" class="calendar-row">
      <el-col :xs="24" :lg="16">
        <div class="calendar-card" data-aos="fade-up">
          <div class="card-header">
            <span class="card-title">订单日历</span>
            <el-button type="primary" link @click="handleViewMoreOrders">查看全部订单</el-button>
          </div>
          <el-calendar v-model="calendarValue">
            <template #date-cell="{ data }">
              <div class="calendar-cell" :class="{ 'has-order': calendarOrderMap[data.day] }">
                <span class="day">{{ data.day.split('-')[2] }}</span>
                <span v-if="calendarOrderMap[data.day]" class="order-count">
                  {{ calendarOrderMap[data.day] }}单
                </span>
              </div>
            </template>
          </el-calendar>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="action-card" data-aos="fade-up">
          <div class="card-header">
            <span class="card-title">快捷入口</span>
          </div>
          <div class="action-buttons">
            <el-button type="primary" :icon="Plus" @click="goTo('/driver/list')">新增司机</el-button>
            <el-button type="success" :icon="Van" @click="goTo('/car/list')">新增车辆</el-button>
            <el-button type="warning" :icon="List" @click="goTo('/order/list')">订单管理</el-button>
            <el-button type="info" :icon="Monitor" @click="goTo('/monitor/map')">实时监控</el-button>
          </div>
          
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  UserFilled, Van, List, Money, CaretTop, Plus, Monitor, Bell, WarningFilled
} from '@element-plus/icons-vue'
import { getDriverUserList } from '@/api/driverUser'
import { getCarList } from '@/api/car'
import { getOrderList } from '@/api/order'
import { getWorkStatus } from '@/api/workStatus'

const router = useRouter()

// 统计数据
const stats = ref({
  totalDrivers: 0,
  totalVehicles: 0,
  todayOrders: 0,
  todayIncome: 0
})

// 在线/离线统计
const onlineCount = ref(0)
const offlineCount = ref(0)

// 趋势图表类型
const trendType = ref('week')

// 图表容器
const trendChartRef = ref(null)
const pieChartRef = ref(null)
let trendChart = null
let pieChart = null

// 日历数据
const calendarValue = ref(new Date())
const calendarOrderMap = ref({})  // key: YYYY-MM-DD, value: 订单数



// 当前时间问候语
const currentTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 格式化金额
const formatMoney = (val) => {
  if (val === undefined) return '0.00'
  return val.toFixed(2)
}

// 跳转
const goTo = (path) => {
  router.push(path)
}

// 获取司机总数
const fetchDriverTotal = async () => {
  try {
    const res = await getDriverUserList({ page: 1, limit: 1 })
    if (res.code === 1 && res.data) {
      stats.value.totalDrivers = res.data.total || 0
    }
  } catch (error) {
    console.error('获取司机总数失败', error)
  }
}

// 获取车辆总数
const fetchVehicleTotal = async () => {
  try {
    const res = await getCarList({ page: 1, limit: 1 })
    if (res.code === 1 && res.data) {
      stats.value.totalVehicles = res.data.total || 0
    }
  } catch (error) {
    console.error('获取车辆总数失败', error)
  }
}

// 获取订单数据（用于今日统计、趋势、日历）
const fetchOrderData = async () => {
  try {
    // 获取全部订单（假设数据量不大，一次性获取）
    const res = await getOrderList({ page: 1, limit: 1000 })
    if (res.code === 1 && res.data) {
      const orders = res.data.items || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().slice(0, 10)

      // 今日统计
      let todayOrderCount = 0
      let todayIncomeTotal = 0
      // 日历聚合
      const orderMap = {}
      // 趋势数据聚合（按天）
      const dayMap = new Map() // key: YYYY-MM-DD, value: { orders, income }

      orders.forEach(order => {
        const orderDate = new Date(order.orderTime)
        const dateStr = orderDate.toISOString().slice(0, 10)
        // 只统计已完成支付的订单（orderStatus === 8）用于收入
        const isPaid = order.orderStatus === 8
        const amount = order.price || 0

        // 今日统计
        if (dateStr === todayStr) {
          todayOrderCount++
          if (isPaid) todayIncomeTotal += amount
        }

        // 日历聚合（所有订单）
        orderMap[dateStr] = (orderMap[dateStr] || 0) + 1

        // 趋势聚合（仅已支付订单，用于收入趋势）
        if (isPaid) {
          if (!dayMap.has(dateStr)) {
            dayMap.set(dateStr, { orders: 0, income: 0 })
          }
          const dayData = dayMap.get(dateStr)
          dayData.orders += 1
          dayData.income += amount
        }
      })

      stats.value.todayOrders = todayOrderCount
      stats.value.todayIncome = todayIncomeTotal
      calendarOrderMap.value = orderMap

      // 准备趋势数据
      const sortedDates = Array.from(dayMap.keys()).sort()
      // 取最近30天
      const last30Days = sortedDates.slice(-30)
      const orderTrend = last30Days.map(d => dayMap.get(d).orders)
      const incomeTrend = last30Days.map(d => dayMap.get(d).income)

      // 渲染趋势图
      renderTrendChart(last30Days, orderTrend, incomeTrend)
    }
  } catch (error) {
    console.error('获取订单数据失败', error)
  }
}

// 获取工作状态（在线/离线统计）
const fetchWorkStatus = async () => {
  try {
    const res = await getWorkStatus()
    if (res.code === 1 && res.data) {
      const statusList = res.data
      onlineCount.value = statusList.filter(s => s.workStatus === 1).length
      offlineCount.value = statusList.filter(s => s.workStatus === 0).length
      renderPieChart()
    }
  } catch (error) {
    console.error('获取工作状态失败', error)
  }
}

// 渲染趋势图（折线图 + 柱状图混合）
const renderTrendChart = (xAxisData, orderData, incomeData) => {
  if (!trendChartRef.value) return
  if (trendChart) trendChart.dispose()
  trendChart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['订单量', '收入金额(元)'],
      right: 10,
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: { rotate: 45, interval: 6 }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单量',
        position: 'left',
        alignTicks: true
      },
      {
        type: 'value',
        name: '收入(元)',
        position: 'right',
        alignTicks: true
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        barWidth: '30%',
        data: orderData,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#69c0ff' }]
          }
        }
      },
      {
        name: '收入金额(元)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: incomeData,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#faad14' },
        itemStyle: { color: '#faad14' }
      }
    ]
  }
  trendChart.setOption(option)
}

// 渲染饼图（在线/离线占比）
const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)

  const option = {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '司机状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: { scale: true },
        data: [
          { value: onlineCount.value, name: '在线', itemStyle: { color: '#52c41a' } },
          { value: offlineCount.value, name: '离线', itemStyle: { color: '#bfbfbf' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

// 查看全部订单（跳转）
const handleViewMoreOrders = () => {
  router.push('/order/list')
}

// 监听趋势类型切换（目前只做近7/30天，数据已全量，只需重新筛选）
watch(trendType, () => {
  // 重新获取订单数据并重新渲染（简单粗暴）
  fetchOrderData()
})

// 初始化所有数据
const initDashboard = async () => {
  await Promise.all([
    fetchDriverTotal(),
    fetchVehicleTotal(),
    fetchOrderData(),
    fetchWorkStatus()
  ])
}

// 窗口大小变化重新渲染图表
const handleResize = () => {
  if (trendChart) trendChart.resize()
  if (pieChart) pieChart.resize()
}

onMounted(() => {
  initDashboard()
  window.addEventListener('resize', handleResize)
})

// 清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChart) trendChart.dispose()
  if (pieChart) pieChart.dispose()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  min-height: 100%;
  position: relative;
}

.bg-decoration {
  position: fixed;
  top: 0;
  right: 0;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(24,144,255,0.03) 0%, rgba(24,144,255,0) 70%);
  pointer-events: none;
  z-index: 0;
}

.welcome-section {
  margin-bottom: 28px;
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  color: #1f2f3d;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #1f2f3d 0%, #2c3e50 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-subtitle {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0;
}

.stats-row {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.stat-card {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(255,255,255,0.5);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.driver-card .stat-icon { background: linear-gradient(135deg, #1890ff, #40a9ff); }
.vehicle-card .stat-icon { background: linear-gradient(135deg, #52c41a, #73d13d); }
.order-card .stat-icon { background: linear-gradient(135deg, #faad14, #ffc53d); }
.income-card .stat-icon { background: linear-gradient(135deg, #f5222d, #ff4d4f); }

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1f2f3d;
  line-height: 1.2;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  color: #bfbfbf;
  display: flex;
  align-items: center;
  gap: 8px;
}

.trend-up {
  color: #52c41a;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.chart-row {
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.chart-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  transition: all 0.3s;
  height: 100%;
}

.chart-card:hover {
  box-shadow: 0 12px 28px rgba(0,0,0,0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2f3d;
  position: relative;
  padding-left: 12px;
}

.card-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #1890ff;
  border-radius: 2px;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.pie-chart {
  height: 240px;
}

.pie-legend {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #595959;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-dot.online { background: #52c41a; }
.legend-dot.offline { background: #bfbfbf; }

.calendar-row {
  position: relative;
  z-index: 1;
}

.calendar-card, .action-card {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  height: 100%;
}

.calendar-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.calendar-cell .day {
  font-size: 14px;
  font-weight: 500;
}

.calendar-cell .order-count {
  font-size: 10px;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 6px;
  border-radius: 20px;
  margin-top: 4px;
}

.calendar-cell.has-order {
  background: rgba(24,144,255,0.05);
  border-radius: 12px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.action-buttons .el-button {
  margin: 0;
  height: 48px;
  font-size: 16px;
}


.reminder-list {
  max-height: 200px;
  overflow-y: auto;
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
  color: #595959;
}

.reminder-item .el-icon {
  color: #faad14;
}

.empty-tip {
  text-align: center;
  color: #bfbfbf;
  padding: 20px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 12px;
  }
  .stat-number {
    font-size: 24px;
  }
  .chart-container {
    height: 240px;
  }
}
</style>