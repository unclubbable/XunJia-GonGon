<template>
  <div class="income-detail-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon total-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">总收入（元）</div>
              <div class="stat-number">{{ totalIncome.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon avg-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">月均收入（元）</div>
              <div class="stat-number">{{ avgIncome.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon peak-icon">
              <el-icon><Top /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">最高月收入（元）</div>
              <div class="stat-number">{{ maxIncome.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon count-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">累计服务月数</div>
              <div class="stat-number">{{ monthCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="司机">
          <el-select v-model="filterForm.driverId" placeholder="全部司机" clearable filterable style="width: 200px">
            <el-option
              v-for="driver in driverOptions"
              :key="driver.driverId"
              :label="`${driver.driverName} (${driver.driverPhone})`"
              :value="driver.driverId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" placeholder="全部年份" clearable style="width: 120px">
            <el-option v-for="y in years" :key="y" :label="y" :value="y" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="filterForm.month" placeholder="全部月份" clearable style="width: 120px">
            <el-option v-for="m in 12" :key="m" :label="`${m}月`" :value="m" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span>月度收入趋势</span>
          </template>
          <div ref="lineChartRef" style="height: 360px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span>收入分布（饼图）</span>
          </template>
          <div ref="pieChartRef" style="height: 360px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table :data="filteredData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="driverName" label="司机姓名" min-width="120" />
        <el-table-column prop="driverPhone" label="手机号" width="130" />
        <el-table-column prop="year" label="年份" width="100" />
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="totalOrderAmount" label="订单总金额（元）" min-width="140">
          <template #default="{ row }">{{ row.totalOrderAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="driverIncome" label="司机收入（元）" min-width="140">
          <template #default="{ row }">{{ row.driverIncome.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="platformCommission" label="平台抽成（元）" min-width="140">
          <template #default="{ row }">{{ row.platformCommission.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="发放状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '已发放' : '未发放' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Money, TrendCharts, Top, Calendar } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMoneyList } from '@/api/finance'
import { getDriverUserList } from '@/api/driverUser'

// 原始数据
const rawMoneyData = ref([])
const driverList = ref([])
const loading = ref(false)

// 筛选表单
const filterForm = reactive({
  driverId: null,
  year: null,
  month: null
})

// 构建司机选项
const driverOptions = computed(() => {
  return driverList.value.map(driver => ({
    driverId: driver.id,
    driverName: driver.driverName,
    driverPhone: driver.driverPhone
  }))
})

// 司机映射表，用于快速查找司机姓名和手机号
const driverMap = computed(() => {
  const map = new Map()
  driverList.value.forEach(driver => {
    map.set(driver.id, {
      name: driver.driverName,
      phone: driver.driverPhone
    })
  })
  return map
})

// 为收入数据添加司机姓名和手机号
const enrichedData = computed(() => {
  return rawMoneyData.value.map(item => {
    const driver = driverMap.value.get(item.driverId)
    return {
      ...item,
      driverName: driver?.name || `司机${item.driverId}`,
      driverPhone: driver?.phone || ''
    }
  })
})

// 可用年份列表
const years = computed(() => {
  const yearsSet = new Set(rawMoneyData.value.map(item => item.year))
  return Array.from(yearsSet).sort((a,b)=>b-a)
})

// 筛选后的数据
const filteredData = computed(() => {
  let data = enrichedData.value
  if (filterForm.driverId) {
    data = data.filter(item => item.driverId === filterForm.driverId)
  }
  if (filterForm.year) {
    data = data.filter(item => item.year === filterForm.year)
  }
  if (filterForm.month) {
    data = data.filter(item => item.month === filterForm.month)
  }
  return data.sort((a,b) => a.year - b.year || a.month - b.month)
})

// 统计值
const totalIncome = computed(() => {
  return filteredData.value.reduce((sum, item) => sum + item.driverIncome, 0)
})
const monthCount = computed(() => filteredData.value.length)
const avgIncome = computed(() => monthCount.value ? totalIncome.value / monthCount.value : 0)
const maxIncome = computed(() => {
  if (!filteredData.value.length) return 0
  return Math.max(...filteredData.value.map(item => item.driverIncome))
})

// 图表实例
const lineChartRef = ref(null)
const pieChartRef = ref(null)
let lineChart = null
let pieChart = null

// 渲染折线图
const renderLineChart = () => {
  if (!lineChartRef.value) return
  if (lineChart) lineChart.dispose()
  lineChart = echarts.init(lineChartRef.value)

  const data = filteredData.value
  const xAxisData = data.map(item => `${item.year}-${item.month}`)
  const incomeData = data.map(item => item.driverIncome)
  const commissionData = data.map(item => item.platformCommission)

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['司机收入', '平台抽成'] },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: '金额（元）' },
    series: [
      { name: '司机收入', type: 'line', data: incomeData, smooth: true, lineStyle: { color: '#67c23a' }, areaStyle: { opacity: 0.1 } },
      { name: '平台抽成', type: 'line', data: commissionData, smooth: true, lineStyle: { color: '#e6a23c' } }
    ]
  })
}

// 渲染饼图
const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)

  const data = filteredData.value
  const driverIncomeMap = new Map()
  data.forEach(item => {
    const current = driverIncomeMap.get(item.driverId) || 0
    driverIncomeMap.set(item.driverId, current + item.driverIncome)
  })
  const pieData = Array.from(driverIncomeMap.entries()).map(([id, value]) => {
    const driver = driverMap.value.get(id)
    const name = driver ? driver.name : `司机${id}`
    return { name, value }
  })

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: pieData,
      emphasis: { scale: true, label: { show: true, formatter: '{b}: {d}%' } }
    }]
  })
}

// 监听筛选变化
watch([filteredData], async () => {
  await nextTick()
  renderLineChart()
  renderPieChart()
})

const handleSearch = () => {}
const resetSearch = () => {
  filterForm.driverId = null
  filterForm.year = null
  filterForm.month = null
}

// 获取司机列表
const fetchDrivers = async () => {
  try {
    const res = await getDriverUserList({ page: 1, limit: 1000 })
    if (res.code === 1 && res.data) {
      driverList.value = res.data.items || []
    } else {
      ElMessage.error(res.message || '获取司机列表失败')
    }
  } catch (error) {
    ElMessage.error('请求司机列表失败')
  }
}

// 获取收入数据
const fetchMoneyData = async () => {
  loading.value = true
  try {
    const res = await getMoneyList()
    if (res.code === 1 && res.data) {
      rawMoneyData.value = res.data
    } else {
      ElMessage.error(res.message || '获取收入数据失败')
    }
  } catch (error) {
    ElMessage.error('请求收入数据失败')
  } finally {
    loading.value = false
  }
}

// 加载所有数据
const loadData = async () => {
  await Promise.all([fetchDrivers(), fetchMoneyData()])
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.income-detail-container {
  padding: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  border-radius: 12px;
}
.stat-card :deep(.el-card__body) {
  padding: 20px;
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.total-icon { background-color: #e6f7ff; color: #1890ff; }
.avg-icon { background-color: #e1f3e1; color: #67c23a; }
.peak-icon { background-color: #fff7e6; color: #faad14; }
.count-icon { background-color: #f4f4f5; color: #909399; }
.stat-info {
  flex: 1;
}
.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 4px;
}
.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
}
.filter-card {
  margin-bottom: 20px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}
.chart-row {
  margin-bottom: 20px;
}
.chart-card {
  height: 100%;
}
</style>