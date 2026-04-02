<template>
  <div class="payment-management-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon pending-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">待发放总额（元）</div>
              <div class="stat-number">{{ pendingTotal.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon paid-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">已发放总额（元）</div>
              <div class="stat-number">{{ paidTotal.toFixed(2) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon unpaid-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">未发放笔数</div>
              <div class="stat-number">{{ pendingCount }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon rate-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-label">发放率</div>
              <div class="stat-number">{{ paymentRate.toFixed(1) }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span>发放状态占比</span>
          </template>
          <div ref="pieChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <span>月度待发放金额趋势</span>
          </template>
          <div ref="lineChartRef" style="height: 300px"></div>
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
        <el-form-item label="发放状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已发放" :value="1" />
            <el-option label="未发放" :value="0" />
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

    <!-- 表格 -->
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
        <el-table-column prop="status" label="发放状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '已发放' : '未发放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              :icon="Money"
              @click="handlePayment(row)"
            >
              发放
            </el-button>
            <span v-else>--</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Clock, CircleCheck, Warning, DataAnalysis, Money } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getMoneyList, putMoneyById } from '@/api/finance'
import { getDriverUserList } from '@/api/driverUser'

// 原始数据
const rawMoneyData = ref([])
const driverList = ref([])
const loading = ref(false)

// 筛选表单
const filterForm = reactive({
  driverId: null,
  status: null,
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

// 司机映射表
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
  if (filterForm.status !== null && filterForm.status !== '') {
    data = data.filter(item => item.status === filterForm.status)
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
const pendingTotal = computed(() => {
  return filteredData.value.filter(item => item.status === 0).reduce((sum, item) => sum + item.driverIncome, 0)
})
const paidTotal = computed(() => {
  return filteredData.value.filter(item => item.status === 1).reduce((sum, item) => sum + item.driverIncome, 0)
})
const pendingCount = computed(() => filteredData.value.filter(item => item.status === 0).length)
const paymentRate = computed(() => {
  const total = pendingTotal.value + paidTotal.value
  return total ? (paidTotal.value / total) * 100 : 0
})

// 图表实例
const pieChartRef = ref(null)
const lineChartRef = ref(null)
let pieChart = null
let lineChart = null

// 渲染饼图
const renderPieChart = () => {
  if (!pieChartRef.value) return
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieChartRef.value)

  const data = filteredData.value
  const paid = data.filter(item => item.status === 1).reduce((sum, item) => sum + item.driverIncome, 0)
  const pending = data.filter(item => item.status === 0).reduce((sum, item) => sum + item.driverIncome, 0)

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: [
        { value: paid, name: '已发放', itemStyle: { color: '#67c23a' } },
        { value: pending, name: '未发放', itemStyle: { color: '#f56c6c' } }
      ],
      emphasis: { scale: true, label: { show: true, formatter: '{b}: {d}%' } }
    }]
  })
}

// 渲染折线图
const renderLineChart = () => {
  if (!lineChartRef.value) return
  if (lineChart) lineChart.dispose()
  lineChart = echarts.init(lineChartRef.value)

  const data = filteredData.value
  const monthMap = new Map()
  data.forEach(item => {
    const key = `${item.year}-${item.month}`
    const pendingAmount = item.status === 0 ? item.driverIncome : 0
    monthMap.set(key, (monthMap.get(key) || 0) + pendingAmount)
  })
  const sortedKeys = Array.from(monthMap.keys()).sort()
  const xAxisData = sortedKeys
  const pendingData = sortedKeys.map(key => monthMap.get(key))

  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { rotate: 45 } },
    yAxis: { type: 'value', name: '待发放金额（元）' },
    series: [{
      name: '待发放金额',
      type: 'line',
      data: pendingData,
      smooth: true,
      lineStyle: { color: '#e6a23c' },
      areaStyle: { opacity: 0.1 }
    }]
  })
}

// 监听筛选变化
watch([filteredData], async () => {
  await nextTick()
  renderPieChart()
  renderLineChart()
})

const handleSearch = () => {}
const resetSearch = () => {
  filterForm.driverId = null
  filterForm.status = null
  filterForm.year = null
  filterForm.month = null
}

// 发放操作
const handlePayment = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认发放司机 ${row.driverName} (${row.driverPhone}) ${row.year}年${row.month}月的收入 ${row.driverIncome.toFixed(2)} 元吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )
    const updateData = { ...row, status: 1 }
    const res = await putMoneyById(updateData)
    if (res.code === 1) {
      ElMessage.success('发放成功')
      // 更新本地数据
      const target = rawMoneyData.value.find(item => item.id === row.id)
      if (target) target.status = 1
    } else {
      ElMessage.error(res.message || '发放失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
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
.payment-management-container {
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
.pending-icon { background-color: #fff7e6; color: #faad14; }
.paid-icon { background-color: #e1f3e1; color: #67c23a; }
.unpaid-icon { background-color: #fef0f0; color: #f56c6c; }
.rate-icon { background-color: #e6f7ff; color: #1890ff; }
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